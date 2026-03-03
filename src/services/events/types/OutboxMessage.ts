export interface OutboxMessage {
  id?: string
  topicName: string
  messageData: unknown
  transactionId?: string
  createdAt?: string
  processedAt?: string | null
}

export interface OutboxMessageFactory<T = unknown> {
  (data: T): OutboxMessage
}

export interface TopicPublisher<T = unknown> {
  (data: T): Promise<void> | void
}

export interface TopicRegistration<T = unknown> {
  publish: TopicPublisher<T>
}
