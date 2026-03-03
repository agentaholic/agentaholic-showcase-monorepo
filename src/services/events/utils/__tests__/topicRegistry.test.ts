import { describe, it, expect, beforeEach } from 'vitest'
import { topicRegistry } from '~src/services/events/utils/topicRegistry'
import Debug from 'debug'
const debug = Debug('test')

describe('topicRegistry', () => {
  beforeEach(() => {
    topicRegistry.clear()
  })

  it('should register and retrieve a topic publisher', () => {
    const mockPublisher = (data: unknown): void => {
      debug('Publishing:', data)
    }

    topicRegistry.registerTopicPublisher('test-topic', mockPublisher)

    const retrievedPublisher = topicRegistry.getTopicPublisher('test-topic')
    expect(retrievedPublisher).toBe(mockPublisher)
  })

  it('should return undefined for unregistered topics', () => {
    const publisher = topicRegistry.getTopicPublisher('nonexistent-topic')
    expect(publisher).toBeUndefined()
  })

  it('should check if topic publisher exists', () => {
    const mockPublisher = (): void => {}

    expect(topicRegistry.hasTopicPublisher('test-topic')).toBe(false)

    topicRegistry.registerTopicPublisher('test-topic', mockPublisher)

    expect(topicRegistry.hasTopicPublisher('test-topic')).toBe(true)
  })

  it('should get all topic names', () => {
    const mockPublisher1 = async (): Promise<void> => {}
    const mockPublisher2 = async (): Promise<void> => {}

    topicRegistry.registerTopicPublisher('topic-1', mockPublisher1)
    topicRegistry.registerTopicPublisher('topic-2', mockPublisher2)

    const topicNames = topicRegistry.getAllTopicNames()
    expect(topicNames).toEqual(['topic-1', 'topic-2'])
  })

  it('should clear all registered topics', () => {
    const mockPublisher = (): void => {}

    topicRegistry.registerTopicPublisher('test-topic', mockPublisher)
    expect(topicRegistry.hasTopicPublisher('test-topic')).toBe(true)

    topicRegistry.clear()
    expect(topicRegistry.hasTopicPublisher('test-topic')).toBe(false)
    expect(topicRegistry.getAllTopicNames()).toEqual([])
  })

  it('should override existing topic publisher when registering with same name', () => {
    const mockPublisher1 = (): void => {
      debug('publisher1')
    }
    const mockPublisher2 = (): void => {
      debug('publisher2')
    }

    topicRegistry.registerTopicPublisher('test-topic', mockPublisher1)
    expect(topicRegistry.getTopicPublisher('test-topic')).toBe(mockPublisher1)

    topicRegistry.registerTopicPublisher('test-topic', mockPublisher2)
    expect(topicRegistry.getTopicPublisher('test-topic')).toBe(mockPublisher2)
  })
})
