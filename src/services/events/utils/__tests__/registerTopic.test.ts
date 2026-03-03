import { describe, it, expect, beforeEach } from 'vitest'
import { registerTopic } from '~src/services/events/utils/registerTopic'
import { topicRegistry } from '~src/services/events/utils/topicRegistry'
import Debug from 'debug'
const debug = Debug('test')

describe('registerTopic', () => {
  beforeEach(() => {
    topicRegistry.clear()
  })

  it('should register a topic and return a message factory', () => {
    const mockPublisher = (data: { message: string }): void => {
      debug('Publishing:', data)
    }

    const createMessage = registerTopic('test-topic', {
      publish: mockPublisher,
    })

    // Verify the topic was registered
    expect(topicRegistry.hasTopicPublisher('test-topic')).toBe(true)
    expect(topicRegistry.getTopicPublisher('test-topic')).toBe(mockPublisher)

    // Test the message factory
    const message = createMessage({ message: 'Hello World' })

    expect(message).toEqual({
      topicName: 'test-topic',
      messageData: { message: 'Hello World' },
    })
  })

  it('should handle different data types', () => {
    const stringPublisher = (data: string): void => {
      debug(data)
    }
    const numberPublisher = (data: number): void => {
      debug(data)
    }
    const objectPublisher = (data: { id: number; name: string }): void => {
      debug(data)
    }

    const createStringMessage = registerTopic('string-topic', {
      publish: stringPublisher,
    })
    const createNumberMessage = registerTopic('number-topic', {
      publish: numberPublisher,
    })
    const createObjectMessage = registerTopic('object-topic', {
      publish: objectPublisher,
    })

    const stringMessage = createStringMessage('test string')
    const numberMessage = createNumberMessage(42)
    const objectMessage = createObjectMessage({ id: 1, name: 'Test' })

    expect(stringMessage.messageData).toBe('test string')
    expect(numberMessage.messageData).toBe(42)
    expect(objectMessage.messageData).toEqual({ id: 1, name: 'Test' })
  })

  it('should register multiple topics independently', () => {
    const publisher1 = (data: unknown): void => {
      debug('Publisher 1:', data)
    }
    const publisher2 = (data: unknown): void => {
      debug('Publisher 2:', data)
    }

    const createMessage1 = registerTopic('topic-1', { publish: publisher1 })
    const createMessage2 = registerTopic('topic-2', { publish: publisher2 })

    expect(topicRegistry.hasTopicPublisher('topic-1')).toBe(true)
    expect(topicRegistry.hasTopicPublisher('topic-2')).toBe(true)
    expect(topicRegistry.getTopicPublisher('topic-1')).toBe(publisher1)
    expect(topicRegistry.getTopicPublisher('topic-2')).toBe(publisher2)

    const message1 = createMessage1('data1')
    const message2 = createMessage2('data2')

    expect(message1.topicName).toBe('topic-1')
    expect(message2.topicName).toBe('topic-2')
  })

  it('should override existing topic registration', () => {
    const originalPublisher = (data: unknown): void => {
      debug('Original:', data)
    }
    const newPublisher = (data: unknown): void => {
      debug('New:', data)
    }

    registerTopic('test-topic', { publish: originalPublisher })
    expect(topicRegistry.getTopicPublisher('test-topic')).toBe(
      originalPublisher,
    )

    registerTopic('test-topic', { publish: newPublisher })
    expect(topicRegistry.getTopicPublisher('test-topic')).toBe(newPublisher)
  })
})
