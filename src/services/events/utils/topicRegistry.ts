import { TopicPublisher } from '~src/services/events/types/OutboxMessage'

class TopicRegistry {
  private publishers = new Map<string, TopicPublisher>()

  registerTopicPublisher<T = unknown>(
    topicName: string,
    publishFn: TopicPublisher<T>,
  ): void {
    this.publishers.set(topicName, publishFn as TopicPublisher)
  }

  getTopicPublisher(topicName: string): TopicPublisher | undefined {
    return this.publishers.get(topicName)
  }

  hasTopicPublisher(topicName: string): boolean {
    return this.publishers.has(topicName)
  }

  getAllTopicNames(): string[] {
    return Array.from(this.publishers.keys())
  }

  clear(): void {
    this.publishers.clear()
  }
}

export const topicRegistry = new TopicRegistry()
