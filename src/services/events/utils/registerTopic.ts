import { topicRegistry } from '~src/services/events/utils/topicRegistry'
import {
  OutboxMessage,
  OutboxMessageFactory,
  TopicRegistration,
} from '~src/services/events/types/OutboxMessage'

/**
 * Registers a pub/sub topic with the transactional outbox pattern and returns a message factory.
 *
 * The transactional outbox pattern ensures atomic publishing of domain events and pub/sub messages
 * within the same database transaction, using PostgreSQL LISTEN/NOTIFY for real-time processing.
 *
 * ## Usage Example
 *
 * ```typescript
 * import { registerTopic } from '~src/services/events/utils/registerTopic'
 * import { events } from '~encore/clients'
 * import { Topic } from 'encore.dev/pubsub'
 *
 * // 1. Define your pub/sub topic
 * const PaymentVerifiedTopic = new Topic<{ payment: { id: string }, status: 'verified' }>('PaymentVerified', {
 *   deliveryGuarantee: 'at-least-once'
 * })
 *
 * // 2. Register the topic and get a message factory
 * // Note: Use an anonymous function to wrap the topic publish call for proper Encore topic usage
 * const createPaymentVerifiedOutboxMessage = registerTopic('PaymentVerified', {
 *   publish: async (data) => {
 *     await PaymentVerifiedTopic.publish(data)
 *   }
 * })
 *
 * // 3. Use in your service endpoint
 * const verifyPayment = api({ expose: false }, async (params: { paymentId: string }): Promise<void> => {
 *   await events.commitTransaction({
 *     events: [
 *       // Your domain events here...
 *     ],
 *     outboxMessages: [
 *       createPaymentVerifiedOutboxMessage({ payment: { id: paymentId }, status: 'verified' })
 *     ]
 *   })
 * })
 * ```
 *
 * ## Process Flow
 *
 * 1. Register topic with publish function → Factory function returned
 * 2. Create outbox messages using factory → Pass to `commitTransaction()`
 * 3. Database transaction inserts events + outbox messages + sends NOTIFY
 * 4. Relayer receives NOTIFY → Queries outbox → Publishes via registered publisher → Marks as processed
 *
 * ## Key Features
 *
 * - **Atomic Transactions**: Events and outbox messages committed together with NOTIFY commands
 * - **Real-time Processing**: PostgreSQL LISTEN/NOTIFY enables immediate message processing
 * - **Reliability**: Startup sweep ensures no messages are lost during system restarts
 * - **Type Safety**: Full TypeScript support with proper generics
 * - **Guaranteed Delivery**: Messages are persisted before publishing
 * - **Exactly-Once Processing**: Database transactions ensure atomicity
 *
 * @param topicName - The name of the topic to register. Must match the Topic name exactly.
 * @param registration - Object containing the publish function for the topic
 * @returns A factory function that creates OutboxMessage objects for the registered topic
 */
export function registerTopic<T = unknown>(
  topicName: string,
  registration: TopicRegistration<T>,
): OutboxMessageFactory<T> {
  topicRegistry.registerTopicPublisher(topicName, registration.publish)

  return (data: T): OutboxMessage => ({
    topicName,
    messageData: data,
  })
}
