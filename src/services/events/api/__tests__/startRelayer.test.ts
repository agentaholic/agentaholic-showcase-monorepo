import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Factory function to create a fresh mock client for each test
function createMockClient() {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue({}),
    end: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  }
}

// Shared reference that gets reset per test
let currentMockClient: ReturnType<typeof createMockClient>

// Mock the pg module BEFORE importing any modules that use it
vi.mock('pg', () => {
  return {
    Client: vi.fn().mockImplementation(() => currentMockClient),
  }
})

import log from 'encore.dev/log'
import {
  processOutboxMessage,
  startRelayer,
} from '~src/services/events/api/startRelayer'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { topicRegistry } from '~src/services/events/utils/topicRegistry'
// Note: convertImportMetaUrlToKebabSlug stays as ~src/ since utils/url is not converted yet
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'

describe.skip('startRelayer', () => {
  const _testNamespace = convertImportMetaUrlToKebabSlug(import.meta.url)

  // Helper function to get the mock client instance
  function getMockClient(): ReturnType<typeof createMockClient> {
    return currentMockClient
  }

  beforeEach(() => {
    // Create a fresh mock client for each test to prevent handler accumulation
    currentMockClient = createMockClient()
    topicRegistry.clear()
    // Reset all mocks before each test
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM outbox WHERE topic_name LIKE 'test-%'`
  })

  it('should process outbox messages when topic publisher is registered', async () => {
    const publishedMessages: unknown[] = []
    const mockPublisher = vi.fn((data: unknown): void => {
      publishedMessages.push(data)
    })

    // Register the topic publisher
    topicRegistry.registerTopicPublisher('test-topic', mockPublisher)

    // Insert a test outbox message
    const result = await eventsDatabase.queryRow`
      INSERT INTO outbox (topic_name, message_data, transaction_id)
      VALUES ('test-topic', ${{ message: 'test data' }}, 'test-tx-1')
      RETURNING id
    `

    expect(result).toBeDefined()

    if (result?.id) {
      await processOutboxMessage(String(result.id))
    }

    // Verify the message was published
    expect(mockPublisher).toHaveBeenCalledWith({ message: 'test data' })
    expect(publishedMessages).toEqual([{ message: 'test data' }])

    // Verify the message was marked as processed
    const processedMessage = await eventsDatabase.queryRow`
      SELECT processed_at FROM outbox WHERE id = ${Number(result?.id ?? 0)}
    `

    expect(processedMessage?.processed_at).not.toBeNull()
  })

  it('should handle missing topic publishers gracefully', async () => {
    const logSpy = vi.spyOn(log, 'error').mockImplementation(() => {})

    // Insert a test outbox message for an unregistered topic
    const result = await eventsDatabase.queryRow`
      INSERT INTO outbox (topic_name, message_data, transaction_id)
      VALUES ('test-unknown-topic', ${{ message: 'test data' }}, 'test-tx-2')
      RETURNING id
    `

    if (result?.id) {
      await processOutboxMessage(String(result.id))
    }

    // Verify error was logged
    expect(logSpy).toHaveBeenCalledWith(
      'No publisher found for topic: test-unknown-topic',
    )

    // Verify the message was not marked as processed
    const unprocessedMessage = await eventsDatabase.queryRow`
      SELECT processed_at FROM outbox WHERE id = ${Number(result?.id ?? 0)}
    `

    expect(unprocessedMessage?.processed_at).toBeNull()

    logSpy.mockRestore()
  })

  it('should handle already processed messages', async () => {
    const mockPublisher = vi.fn(async () => {})
    topicRegistry.registerTopicPublisher('test-topic', mockPublisher)

    // Insert and immediately mark as processed
    const result = await eventsDatabase.queryRow`
      INSERT INTO outbox (topic_name, message_data, transaction_id, processed_at)
      VALUES ('test-topic', ${{ message: 'test data' }}, 'test-tx-3', NOW())
      RETURNING id
    `

    if (result?.id) {
      await processOutboxMessage(String(result.id))
    }

    // Verify the publisher was not called
    expect(mockPublisher).not.toHaveBeenCalled()
  })

  it('should handle database sweep function', async () => {
    // Insert multiple unprocessed messages
    await eventsDatabase.exec`
      INSERT INTO outbox (topic_name, message_data, transaction_id)
      VALUES
        ('test-topic-1', ${{ data: 1 }}, 'test-tx-sweep-1'),
        ('test-topic-2', ${{ data: 2 }}, 'test-tx-sweep-2')
    `

    // Test the sweep function (this would normally trigger NOTIFY commands)
    await eventsDatabase.exec`SELECT sweep_and_notify_outbox()`

    // Verify the function executed without errors
    // In a real implementation, we would test that NOTIFY commands were sent
    // but that requires a more complex test setup with LISTEN connections
    const unprocessedCount = await eventsDatabase.queryRow`
      SELECT COUNT(*) as count FROM outbox
      WHERE processed_at IS NULL AND topic_name LIKE 'test-topic-%'
    `

    expect(Number(unprocessedCount?.count)).toBe(2)
  })

  it('should handle publisher errors gracefully', async () => {
    const logSpy = vi.spyOn(log, 'error').mockImplementation(() => {})

    const failingPublisher = vi.fn(() => {
      throw new Error('Publisher failed')
    })

    topicRegistry.registerTopicPublisher('test-topic', failingPublisher)

    const result = await eventsDatabase.queryRow`
      INSERT INTO outbox (topic_name, message_data, transaction_id)
      VALUES ('test-topic', ${{ message: 'test data' }}, 'test-tx-4')
      RETURNING id
    `

    if (result?.id) {
      await processOutboxMessage(String(result.id))
    }

    // Verify error was logged
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        `Error processing outbox message ${Number(result?.id ?? 0)}:`,
      ),
      expect.any(Error),
    )

    // Verify the message was not marked as processed due to the error
    const unprocessedMessage = await eventsDatabase.queryRow`
      SELECT processed_at FROM outbox WHERE id = ${Number(result?.id ?? 0)}
    `

    expect(unprocessedMessage?.processed_at).toBeNull()

    logSpy.mockRestore()
  })

  describe('notification handler', () => {
    it('should process messages when notifications are received', async () => {
      const logSpy = vi.spyOn(log, 'debug').mockImplementation(() => {})

      // Start relayer to set up notification handler
      await startRelayer()

      // Get the notification handler that was registered
      const mockClient = getMockClient()
      const notificationHandler = mockClient.on.mock.calls.find(
        (call) => call[0] === 'notification',
      )?.[1] as
        | ((msg: { channel: string; payload: string }) => void)
        | undefined

      expect(notificationHandler).toBeDefined()

      // Simulate a notification - the handler fires processOutboxMessage asynchronously
      if (notificationHandler) {
        notificationHandler({
          channel: 'outbox_message',
          payload: '123',
        })

        // Wait for the async processOutboxMessage to log completion
        // Use vi.waitFor for deterministic waiting instead of arbitrary setTimeout
        await vi.waitFor(() => {
          expect(logSpy).toHaveBeenCalledWith(
            'Outbox message 123 not found or already processed',
          )
        })
      }

      logSpy.mockRestore()
    })

    it('should ignore notifications on wrong channel', async () => {
      const logSpy = vi.spyOn(log, 'debug').mockImplementation(() => {})

      // Start relayer to set up notification handler
      await startRelayer()

      // Get the notification handler
      const mockClient = getMockClient()
      const notificationHandler = mockClient.on.mock.calls.find(
        (call) => call[0] === 'notification',
      )?.[1] as
        | ((msg: { channel: string; payload: string }) => void)
        | undefined

      expect(notificationHandler).toBeDefined()

      // Simulate a notification on wrong channel - should be ignored
      if (notificationHandler) {
        notificationHandler({
          channel: 'wrong_channel',
          payload: '456',
        })
      }

      // Verify processOutboxMessage was NOT called (no Processing log)
      expect(logSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Processing outbox message'),
      )

      logSpy.mockRestore()
    })
  })

  describe('connection error handling', () => {
    it('should handle PostgreSQL connection errors with reconnection', async () => {
      const logSpy = vi.spyOn(log, 'error').mockImplementation(() => {})
      // Don't execute callback immediately - just capture that setTimeout was called
      // Executing immediately causes recursive setupListenNotify calls
      const setTimeoutSpy = vi
        .spyOn(global, 'setTimeout')
        .mockReturnValue({} as NodeJS.Timeout)

      // Start relayer
      await startRelayer()

      // Get the error handler
      const mockClient = getMockClient()
      const errorHandler = mockClient.on.mock.calls.find(
        (call) => call[0] === 'error',
      )?.[1] as ((error: Error) => void) | undefined

      expect(errorHandler).toBeDefined()

      // Simulate connection error
      if (errorHandler) {
        errorHandler(new Error('Connection lost'))
      }

      // Verify error logging and reconnection attempt
      expect(logSpy).toHaveBeenCalledWith(
        'PostgreSQL LISTEN connection error:',
        expect.any(Error),
      )
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000)

      logSpy.mockRestore()
      setTimeoutSpy.mockRestore()
    })

    it('should handle PostgreSQL connection end with reconnection', async () => {
      const logSpy = vi.spyOn(log, 'debug').mockImplementation(() => {})
      // Don't execute callback immediately - just capture that setTimeout was called
      // Executing immediately causes recursive setupListenNotify calls
      const setTimeoutSpy = vi
        .spyOn(global, 'setTimeout')
        .mockReturnValue({} as NodeJS.Timeout)

      // Start relayer
      await startRelayer()

      // Get the end handler
      const mockClient = getMockClient()
      const endHandler = mockClient.on.mock.calls.find(
        (call) => call[0] === 'end',
      )?.[1] as (() => void) | undefined

      expect(endHandler).toBeDefined()

      // Simulate connection end
      if (endHandler) {
        endHandler()
      }

      // Verify logging and reconnection attempt
      expect(logSpy).toHaveBeenCalledWith('PostgreSQL LISTEN connection ended')
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000)

      logSpy.mockRestore()
      setTimeoutSpy.mockRestore()
    })
  })
})
