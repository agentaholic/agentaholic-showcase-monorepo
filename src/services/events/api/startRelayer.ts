/* v8 ignore start */
import { appMeta } from 'encore.dev'
import log from 'encore.dev/log'
import { Client } from 'pg'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { OutboxMessage } from '~src/services/events/types/OutboxMessage'
import { topicRegistry } from '~src/services/events/utils/topicRegistry'

export async function startRelayer(): Promise<void> {
  await setupListenNotify()
  await sweepUnprocessedMessages()
}

// Start the relayer when the module is loaded (except in test environment)
/* v8 ignore start */
if (appMeta().environment.type !== 'test') {
  void startRelayer()
}
/* v8 ignore stop */

async function sweepUnprocessedMessages(): Promise<void> {
  log.debug('Sweeping unprocessed outbox messages...')

  // Use the PostgreSQL function to atomically sweep and notify
  await eventsDatabase.exec`SELECT sweep_and_notify_outbox()`
  log.debug('Sweep completed successfully')
}

async function setupListenNotify(): Promise<void> {
  log.debug('Setting up LISTEN/NOTIFY for outbox messages...')

  let listenClient: Client | null = new Client(eventsDatabase.connectionString)

  await listenClient.connect()
  log.debug('Connected to PostgreSQL for LISTEN/NOTIFY')

  // Handle notifications
  listenClient.on('notification', (msg) => {
    if (msg.channel === 'outbox_message' && msg.payload) {
      const messageId = msg.payload
      // Process the message in the background without blocking the event handler
      void processOutboxMessage(messageId)
    }
  })

  /* v8 ignore start */
  // Handle connection errors and reconnection
  listenClient.on('error', (error) => {
    log.error('PostgreSQL LISTEN connection error:', error)
    // Clean up current client and attempt reconnection
    listenClient = null
    setTimeout(() => {
      if (listenClient != null) {
        setupListenNotify().catch((reason: unknown) => {
          log.error(reason)
        })
      }
    }, 5000) // Retry after 5 seconds
  })

  listenClient.on('end', () => {
    log.debug('PostgreSQL LISTEN connection ended')
    // Clean up current client and attempt reconnection
    listenClient = null
    setTimeout(() => {
      if (!listenClient) {
        setupListenNotify().catch((reason: unknown) => {
          log.error(reason)
        })
      }
    }, 1000) // Retry after 1 second
  })
  /* v8 ignore stop */

  // Set up LISTEN for outbox messages
  await listenClient.query('LISTEN outbox_message')
  log.debug('LISTEN established for outbox_message channel')
}

export async function processOutboxMessage(messageId: string): Promise<void> {
  try {
    log.debug(`Processing outbox message: ${messageId}`)

    // Fetch the outbox message from the database
    const message = await eventsDatabase.queryRow`
      SELECT id, topic_name, message_data, transaction_id, created_at, processed_at
      FROM outbox
      WHERE id = ${parseInt(messageId, 10)}
      AND processed_at IS NULL
    `

    if (!message) {
      log.debug(`Outbox message ${messageId} not found or already processed`)
      return
    }

    const outboxMessage: OutboxMessage = {
      id: String(message.id),
      topicName: message.topic_name as string,
      messageData: message.message_data,
      transactionId: message.transaction_id as string,
      createdAt: message.created_at as string,
      processedAt: message.processed_at as string | null,
    }

    // Get the topic publisher from the registry
    const topicPublisher = topicRegistry.getTopicPublisher(
      outboxMessage.topicName,
    )

    if (!topicPublisher) {
      log.error(`No publisher found for topic: ${outboxMessage.topicName}`)
      // TODO: Implement dead letter queue or retry logic for unknown topics
      return
    }

    // Publish the message using the registered publisher
    await topicPublisher(outboxMessage.messageData)

    // Mark the message as processed
    await eventsDatabase.exec`
      UPDATE outbox
      SET processed_at = NOW()
      WHERE id = ${parseInt(messageId, 10)}
    `

    log.debug(`Successfully processed outbox message: ${messageId}`)
  } catch (error) {
    log.error(`Error processing outbox message ${messageId}:`, error)
    // TODO: Implement retry logic with exponential backoff
  }
}
/* v8 ignore stop */
