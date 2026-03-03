import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import {
  CommitTransactionRequest,
  InnerDomainEvent,
} from '~src/services/events/api/commitTransaction'
import { OutboxMessage } from '~src/services/events/types/OutboxMessage'
// Note: convertImportMetaUrlToKebabSlug stays as ~src/ since utils/url is not converted yet
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'

describe('events.commitTransaction', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  // Clean up test data after each test
  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
    await eventsDatabase.exec`DELETE FROM outbox WHERE transaction_id IN (
      SELECT DISTINCT transaction_id FROM events WHERE namespace_slug = ${testNamespace.slug}
    ) OR topic_name LIKE 'test-%'`
  })

  it('should successfully commit a single event', async () => {
    const testEvent: InnerDomainEvent = {
      id: 'test-event-1',
      version: 1,
      name: 'TestEvent',
      aggregate: {
        name: 'TestAggregate',
        id: 'test-aggregate-1',
        service: { name: 'testService' },
      },
      data: { message: 'test data' },
    }

    const request: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
    }

    await events.commitTransaction(request)

    // Verify the event was stored in the database
    const storedEvent = await eventsDatabase.queryRow`
      SELECT * FROM events 
      WHERE id = ${testEvent.id} 
      AND namespace_slug = ${testNamespace.slug}
    `

    expect(storedEvent).toBeDefined()
    if (!storedEvent) {
      throw new Error('Expected storedEvent to be defined')
    }
    expect(storedEvent.id).toBe(testEvent.id)
    expect(storedEvent.revision).toBeGreaterThan(0)
  })

  it('should successfully commit multiple events in a single transaction', async () => {
    const testEvents: InnerDomainEvent[] = [
      {
        id: 'test-event-1',
        version: 1,
        name: 'TestEvent1',
        aggregate: {
          name: 'TestAggregate',
          id: 'test-aggregate-1',
          service: { name: 'testService' },
        },
        data: { message: 'test data 1' },
      },
      {
        id: 'test-event-2',
        version: 2,
        name: 'TestEvent2',
        aggregate: {
          name: 'TestAggregate',
          id: 'test-aggregate-1',
          service: { name: 'testService' },
        },
        data: { message: 'test data 2' },
      },
    ]

    const request: CommitTransactionRequest = {
      events: testEvents,
      namespace: testNamespace,
    }

    await events.commitTransaction(request)

    // Verify both events were stored in the database
    const storedEventsGenerator = eventsDatabase.query`
      SELECT * FROM events 
      WHERE namespace_slug = ${testNamespace.slug}
      AND id IN (${testEvents[0].id}, ${testEvents[1].id})
      ORDER BY revision
    `

    const storedEvents: Array<Record<string, unknown>> = []
    for await (const event of storedEventsGenerator) {
      storedEvents.push(event)
    }

    expect(storedEvents).toHaveLength(2)
    expect(Number(storedEvents[1].revision)).toBeGreaterThan(
      Number(storedEvents[0].revision),
    )
  })

  it('should store events with correct metadata in the database', async () => {
    const testEvent: InnerDomainEvent = {
      id: 'test-event-metadata',
      version: 1,
      name: 'MetadataTestEvent',
      aggregate: {
        name: 'TestAggregate',
        id: 'test-aggregate-metadata',
        service: { name: 'testService' },
      },
      data: { key: 'value' },
    }

    const request: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
    }

    await events.commitTransaction(request)

    // Verify the event was stored in the database
    const storedEvent = await eventsDatabase.queryRow`
      SELECT * FROM events 
      WHERE id = ${testEvent.id} 
      AND namespace_slug = ${testNamespace.slug}
    `

    if (!storedEvent) {
      throw new Error('Expected storedEvent to be defined')
    }

    expect(storedEvent.id).toBe(testEvent.id)
    expect(storedEvent.service_name).toBe(testEvent.aggregate.service.name)
    expect(storedEvent.aggregate_name).toBe(testEvent.aggregate.name)
    expect(storedEvent.aggregate_id).toBe(testEvent.aggregate.id)
    expect(storedEvent.namespace_slug).toBe(testNamespace.slug)
    expect(storedEvent.transaction_id).toBeDefined()

    // Verify the complete event data is stored correctly
    const eventData = storedEvent.data as Record<string, unknown>
    expect(eventData.id).toBe(testEvent.id)
    expect(eventData.name).toBe(testEvent.name)
    expect(eventData.version).toBe(testEvent.version)
    expect(eventData.data).toEqual(testEvent.data)
    expect(eventData.metadata).toBeDefined()
    const metadata = eventData.metadata as Record<string, unknown>
    const namespace = metadata.namespace as Record<string, unknown>
    const transaction = metadata.transaction as Record<string, unknown>
    expect(namespace.slug).toBe(testNamespace.slug)
    expect(transaction.id).toBeDefined()
    expect(metadata.timestamp).toBeDefined()
  })

  it('should assign the same transaction ID to all events in a batch', async () => {
    const testEvents: InnerDomainEvent[] = [
      {
        id: 'batch-event-1',
        version: 1,
        name: 'BatchEvent1',
        aggregate: {
          name: 'BatchAggregate',
          id: 'batch-aggregate-1',
          service: { name: 'batchService' },
        },
        data: {},
      },
      {
        id: 'batch-event-2',
        version: 1,
        name: 'BatchEvent2',
        aggregate: {
          name: 'BatchAggregate',
          id: 'batch-aggregate-2',
          service: { name: 'batchService' },
        },
        data: {},
      },
    ]

    const request: CommitTransactionRequest = {
      events: testEvents,
      namespace: testNamespace,
    }

    await events.commitTransaction(request)

    // Verify all events have the same transaction ID
    const storedEventsGenerator = eventsDatabase.query`
      SELECT transaction_id FROM events 
      WHERE namespace_slug = ${testNamespace.slug}
      AND id IN (${testEvents[0].id}, ${testEvents[1].id})
    `

    const storedEvents: Array<Record<string, unknown>> = []
    for await (const event of storedEventsGenerator) {
      storedEvents.push(event)
    }

    expect(storedEvents.length).toBe(2)
    expect(storedEvents[0].transaction_id).toBeDefined()
    expect(storedEvents[0].transaction_id).toBe(storedEvents[1].transaction_id)
  })

  it('should handle empty event array', async () => {
    const request: CommitTransactionRequest = {
      events: [],
      namespace: testNamespace,
    }

    await events.commitTransaction(request)

    // Verify no events were stored
    const storedEventsGenerator = eventsDatabase.query`
      SELECT * FROM events 
      WHERE namespace_slug = ${testNamespace.slug}
    `

    const storedEvents: Array<Record<string, unknown>> = []
    for await (const event of storedEventsGenerator) {
      storedEvents.push(event)
    }

    expect(storedEvents).toHaveLength(0)
  })

  it('should generate unique transaction IDs for different requests', async () => {
    const testEvent: InnerDomainEvent = {
      id: 'unique-test-event',
      version: 1,
      name: 'UniqueTestEvent',
      aggregate: {
        name: 'UniqueAggregate',
        id: 'unique-aggregate-1',
        service: { name: 'uniqueService' },
      },
      data: {},
    }

    const request1: CommitTransactionRequest = {
      events: [{ ...testEvent, id: 'unique-test-event-1' }],
      namespace: testNamespace,
    }

    const request2: CommitTransactionRequest = {
      events: [{ ...testEvent, id: 'unique-test-event-2' }],
      namespace: testNamespace,
    }

    await events.commitTransaction(request1)
    await events.commitTransaction(request2)

    // Verify both events were stored with different transaction IDs
    const storedEventsGenerator = eventsDatabase.query`
      SELECT transaction_id FROM events 
      WHERE namespace_slug = ${testNamespace.slug}
      AND id IN ('unique-test-event-1', 'unique-test-event-2')
    `

    const storedEvents: Array<Record<string, unknown>> = []
    for await (const event of storedEventsGenerator) {
      storedEvents.push(event)
    }

    expect(storedEvents).toHaveLength(2)
    expect(storedEvents[0].transaction_id).not.toBe(
      storedEvents[1].transaction_id,
    )
  })

  it('should handle events with complex data structures', async () => {
    const complexData = {
      user: {
        id: 'user-123',
        name: 'John Doe',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      },
      items: [
        { id: 1, name: 'Item 1', tags: ['tag1', 'tag2'] },
        { id: 2, name: 'Item 2', tags: ['tag3'] },
      ],
      metadata: {
        source: 'api',
        timestamp: new Date().toISOString(),
      },
    }

    const testEvent: InnerDomainEvent = {
      id: 'complex-data-event',
      version: 1,
      name: 'ComplexDataEvent',
      aggregate: {
        name: 'ComplexAggregate',
        id: 'complex-aggregate-1',
        service: { name: 'complexService' },
      },
      data: complexData,
    }

    const request: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
    }

    await events.commitTransaction(request)

    // Verify complex data was stored correctly
    const storedEvent = await eventsDatabase.queryRow`
      SELECT data FROM events 
      WHERE id = ${testEvent.id} 
      AND namespace_slug = ${testNamespace.slug}
    `

    if (!storedEvent) {
      throw new Error('Expected storedEvent to be defined')
    }

    const eventData = storedEvent.data as Record<string, unknown>
    expect(eventData.data).toEqual(complexData)
  })

  it('should successfully commit events with outbox messages', async () => {
    const testEvent: InnerDomainEvent = {
      id: 'test-event-with-outbox',
      version: 1,
      name: 'TestEventWithOutbox',
      aggregate: {
        name: 'TestAggregate',
        id: 'test-aggregate-outbox',
        service: { name: 'testService' },
      },
      data: { message: 'event with outbox' },
    }

    const outboxMessage: OutboxMessage = {
      topicName: 'test-topic',
      messageData: { notification: 'Event processed', eventId: testEvent.id },
    }

    const request: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
      outboxMessages: [outboxMessage],
    }

    await events.commitTransaction(request)

    // Verify the event was stored
    const storedEvent = await eventsDatabase.queryRow`
      SELECT * FROM events
      WHERE id = ${testEvent.id}
      AND namespace_slug = ${testNamespace.slug}
    `

    expect(storedEvent).toBeDefined()

    // Verify the outbox message was stored
    const storedOutboxMessage = await eventsDatabase.queryRow`
      SELECT * FROM outbox
      WHERE topic_name = ${outboxMessage.topicName}
      AND transaction_id = ${String(storedEvent?.transaction_id ?? '')}
    `

    expect(storedOutboxMessage).toBeDefined()
    if (!storedOutboxMessage) {
      throw new Error('Expected storedOutboxMessage to be defined')
    }

    expect(storedOutboxMessage.topic_name).toBe(outboxMessage.topicName)
    expect(storedOutboxMessage.message_data).toEqual(outboxMessage.messageData)
    expect(storedOutboxMessage.processed_at).toBeNull()
  })

  it('should handle multiple outbox messages in one transaction', async () => {
    const testEvent: InnerDomainEvent = {
      id: 'test-event-multiple-outbox',
      version: 1,
      name: 'TestEventMultipleOutbox',
      aggregate: {
        name: 'TestAggregate',
        id: 'test-aggregate-multiple',
        service: { name: 'testService' },
      },
      data: { message: 'event with multiple outbox' },
    }

    const outboxMessage1: OutboxMessage = {
      topicName: 'test-topic-1',
      messageData: { type: 'notification1' },
    }

    const outboxMessage2: OutboxMessage = {
      topicName: 'test-topic-2',
      messageData: { type: 'notification2' },
    }

    const request: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
      outboxMessages: [outboxMessage1, outboxMessage2],
    }

    await events.commitTransaction(request)

    // Verify the event was stored
    const storedEvent = await eventsDatabase.queryRow`
      SELECT * FROM events
      WHERE id = ${testEvent.id}
      AND namespace_slug = ${testNamespace.slug}
    `

    expect(storedEvent).toBeDefined()

    // Verify both outbox messages were stored with the same transaction ID
    const storedOutboxMessages = eventsDatabase.query`
      SELECT * FROM outbox
      WHERE transaction_id = ${String(storedEvent?.transaction_id ?? '')}
      ORDER BY topic_name
    `

    const messages: Array<Record<string, unknown>> = []
    for await (const message of storedOutboxMessages) {
      messages.push(message)
    }

    expect(messages).toHaveLength(2)
    expect(messages[0].topic_name).toBe('test-topic-1')
    expect(messages[1].topic_name).toBe('test-topic-2')
    expect(messages[0].transaction_id).toBe(messages[1].transaction_id)
  })

  it('should work without outbox messages (backward compatibility)', async () => {
    const testEvent: InnerDomainEvent = {
      id: 'test-event-no-outbox',
      version: 1,
      name: 'TestEventNoOutbox',
      aggregate: {
        name: 'TestAggregate',
        id: 'test-aggregate-no-outbox',
        service: { name: 'testService' },
      },
      data: { message: 'no outbox' },
    }

    const request: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
      // outboxMessages is intentionally omitted
    }

    await events.commitTransaction(request)

    // Verify the event was stored
    const storedEvent = await eventsDatabase.queryRow`
      SELECT * FROM events
      WHERE id = ${testEvent.id}
      AND namespace_slug = ${testNamespace.slug}
    `

    expect(storedEvent).toBeDefined()

    // Verify no outbox messages were created
    const outboxCount = await eventsDatabase.queryRow`
      SELECT COUNT(*) as count FROM outbox
      WHERE transaction_id = ${String(storedEvent?.transaction_id ?? '')}
    `

    expect(Number(outboxCount?.count)).toBe(0)
  })

  it('should handle empty outbox messages array', async () => {
    const testEvent: InnerDomainEvent = {
      id: 'test-event-empty-outbox',
      version: 1,
      name: 'TestEventEmptyOutbox',
      aggregate: {
        name: 'TestAggregate',
        id: 'test-aggregate-empty-outbox',
        service: { name: 'testService' },
      },
      data: { message: 'empty outbox' },
    }

    const request: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
      outboxMessages: [],
    }

    await events.commitTransaction(request)

    // Verify the event was stored
    const storedEvent = await eventsDatabase.queryRow`
      SELECT * FROM events
      WHERE id = ${testEvent.id}
      AND namespace_slug = ${testNamespace.slug}
    `

    expect(storedEvent).toBeDefined()

    // Verify no outbox messages were created
    const outboxCount = await eventsDatabase.queryRow`
      SELECT COUNT(*) as count FROM outbox
      WHERE transaction_id = ${String(storedEvent?.transaction_id ?? '')}
    `

    expect(Number(outboxCount?.count)).toBe(0)
  })

  it('should silently skip duplicate event IDs (idempotency)', async () => {
    const testEvent: InnerDomainEvent = {
      id: 'test-event-idempotent',
      version: 1,
      name: 'IdempotentEvent',
      aggregate: {
        name: 'TestAggregate',
        id: 'test-aggregate-idempotent',
        service: { name: 'testService' },
      },
      data: { message: 'first commit' },
    }

    // First commit should succeed
    await events.commitTransaction({
      events: [testEvent],
      namespace: testNamespace,
    })

    // Second commit with the same event ID should not throw
    await events.commitTransaction({
      events: [testEvent],
      namespace: testNamespace,
    })

    // Verify only one event was stored
    const countResult = await eventsDatabase.queryRow`
      SELECT COUNT(*)::int as count FROM events
      WHERE id = ${testEvent.id}
      AND namespace_slug = ${testNamespace.slug}
    `

    expect(Number(countResult?.count)).toBe(1)
  })

  it('should include trace context in event metadata', async () => {
    const testEvent: InnerDomainEvent = {
      id: 'test-event-trace-context',
      version: 1,
      name: 'TraceContextEvent',
      aggregate: {
        name: 'TestAggregate',
        id: 'test-aggregate-trace',
        service: { name: 'testService' },
      },
      data: { message: 'trace context test' },
    }

    const request: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
    }

    await events.commitTransaction(request)

    // Verify the event was stored with trace context
    const storedEvent = await eventsDatabase.queryRow`
      SELECT data FROM events
      WHERE id = ${testEvent.id}
      AND namespace_slug = ${testNamespace.slug}
    `

    if (!storedEvent) {
      throw new Error('Expected storedEvent to be defined')
    }

    const eventData = storedEvent.data as Record<string, unknown>
    const metadata = eventData.metadata as Record<string, unknown>

    // When running in Encore test context, traceId and spanId should be populated
    // These are captured from currentRequest()?.trace
    expect(metadata.traceId).toBeDefined()
    expect(typeof metadata.traceId).toBe('string')
    expect(metadata.spanId).toBeDefined()
    expect(typeof metadata.spanId).toBe('string')
  })
})
