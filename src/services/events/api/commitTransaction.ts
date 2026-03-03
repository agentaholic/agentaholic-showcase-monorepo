import { api } from 'encore.dev/api'
import { currentRequest } from 'encore.dev'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { BaseDomainEvent } from '~src/services/events/types/BaseDomainEvent'
import { OutboxMessage } from '~src/services/events/types/OutboxMessage'
/* v8 ignore next */
import { generateId } from '~src/utils/id/generateId'

// Inner layer domain event without metadata (as per architecture doc)
export interface InnerDomainEvent {
  id: string
  version: number
  name: string
  aggregate: {
    name: string
    id: string | number
    service: { name: string }
  }
  data: unknown
}

export interface CommitTransactionRequest {
  events: InnerDomainEvent[]
  namespace: { slug: string }
  outboxMessages?: OutboxMessage[]
}

export const commitTransaction = api<CommitTransactionRequest>(
  {
    method: 'POST',
    path: '/events/commit-transaction',
    expose: false,
  },
  async ({
    events,
    namespace,
    outboxMessages,
  }: CommitTransactionRequest): Promise<void> => {
    // Generate a unique transaction ID
    const transaction = { id: generateId({ mode: 'random' }) }
    const timestamp = new Date().toISOString()

    // Capture trace context for observability
    const trace = currentRequest()?.trace

    // Use database transaction to ensure atomicity
    await using tx = await eventsDatabase.begin()

    // Process each event with the same transaction ID to ensure they are grouped
    for (const event of events) {
      // Create the complete domain event with metadata
      const completeEvent: BaseDomainEvent = {
        ...event,
        metadata: {
          timestamp,
          namespace,
          transaction,
          traceId: trace?.traceId,
          spanId: trace?.spanId,
        },
      }

      // Insert the event into the database using the transaction
      // ON CONFLICT (id) DO NOTHING handles idempotent replays gracefully
      const row = await tx.queryRow`
        INSERT INTO events (
          id,
          service_name,
          aggregate_name,
          aggregate_id,
          namespace_slug,
          transaction_id,
          data
        )
        VALUES (
          ${completeEvent.id},
          ${completeEvent.aggregate.service.name},
          ${completeEvent.aggregate.name},
          ${String(completeEvent.aggregate.id)},
          ${completeEvent.metadata.namespace.slug},
          ${completeEvent.metadata.transaction.id},
          ${completeEvent}
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING revision
      `

      // If row is null, this event was already committed (duplicate) — skip it
      if (!row) continue
    }

    // Process outbox messages if provided
    if (outboxMessages && outboxMessages.length > 0) {
      for (const outboxMessage of outboxMessages) {
        // Insert outbox message into the database using the same transaction
        const result = await tx.queryRow`
          INSERT INTO outbox (
            topic_name,
            message_data,
            transaction_id
          )
          VALUES (
            ${outboxMessage.topicName},
            ${
              /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */ // eslint-disable-next-line @typescript-eslint/no-explicit-any
              outboxMessage.messageData as any
            },
            ${transaction.id}
          )
          RETURNING id
        `

        // Send NOTIFY command for real-time processing within the same transaction
        if (result?.id) {
          await tx.exec`SELECT pg_notify('outbox_message', ${String(result.id)})`
        }
      }
    }

    // Commit the transaction - all events and outbox messages are inserted atomically
    await tx.commit()
  },
)
