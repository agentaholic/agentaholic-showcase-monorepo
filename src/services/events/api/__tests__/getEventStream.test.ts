import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import {
  CommitTransactionRequest,
  InnerDomainEvent,
} from '~src/services/events/api/commitTransaction'
import { GetEventStreamRequest } from '~src/services/events/api/getEventStream'
import Debug from 'debug'
const debug = Debug('test')

describe('events.getEventStream', () => {
  const testNamespace = { slug: 'test-stream-namespace' }

  // Clean up test data after each test
  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should successfully call the streaming endpoint', async () => {
    // First, commit a test event
    const testEvent: InnerDomainEvent = {
      id: 'stream-test-event',
      version: 1,
      name: 'StreamTestEvent',
      aggregate: {
        name: 'StreamTestAggregate',
        id: 'stream-test-aggregate-1',
        service: { name: 'streamTestService' },
      },
      data: { message: 'test event for streaming' },
    }

    const commitRequest: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
    }

    await events.commitTransaction(commitRequest)

    // Now test the stream with a simple request
    const streamRequest: GetEventStreamRequest = {
      namespace: testNamespace,
      service: { name: 'streamTestService' },
      aggregate: { name: 'StreamTestAggregate' },
    }

    // Test calling the streaming endpoint
    const stream = await events.getEventStream({
      payload: JSON.stringify(streamRequest),
    })

    const streamedEvents = []
    for await (const response of stream) {
      streamedEvents.push(response.event)
    }

    expect(streamedEvents).toHaveLength(1)
    expect(streamedEvents[0].id).toBe('stream-test-event')
    expect(streamedEvents[0].name).toBe('StreamTestEvent')
    expect(streamedEvents[0].data).toEqual({
      message: 'test event for streaming',
    })
  })

  it('should filter events by fromRevision parameter', async () => {
    // First, commit multiple test events
    const testEvent1: InnerDomainEvent = {
      id: 'stream-test-event-1',
      version: 1,
      name: 'StreamTestEvent',
      aggregate: {
        name: 'StreamTestAggregate',
        id: 'stream-test-aggregate-1',
        service: { name: 'streamTestService' },
      },
      data: { message: 'first test event' },
    }

    const testEvent2: InnerDomainEvent = {
      id: 'stream-test-event-2',
      version: 1,
      name: 'StreamTestEvent',
      aggregate: {
        name: 'StreamTestAggregate',
        id: 'stream-test-aggregate-1',
        service: { name: 'streamTestService' },
      },
      data: { message: 'second test event' },
    }

    // Commit events in separate transactions to get different revision numbers
    await events.commitTransaction({
      events: [testEvent1],
      namespace: testNamespace,
    })

    await events.commitTransaction({
      events: [testEvent2],
      namespace: testNamespace,
    })

    // First get all events to see what revision numbers exist
    const allEventsStreamRequest: GetEventStreamRequest = {
      namespace: testNamespace,
      service: { name: 'streamTestService' },
      aggregate: { name: 'StreamTestAggregate' },
    }

    const allEventsStream = await events.getEventStream({
      payload: JSON.stringify(allEventsStreamRequest),
    })

    const allEvents = []
    for await (const response of allEventsStream) {
      allEvents.push(response.event)
    }

    // TODO: use debug library to log
    debug(
      'All events revisions:',
      allEvents.map((e) => e.metadata.revision),
    )
    expect(allEvents).toHaveLength(2)

    // Now test filtering with fromRevision using the first event's revision
    const firstRevision = allEvents[0].metadata.revision
    const streamRequest: GetEventStreamRequest = {
      namespace: testNamespace,
      service: { name: 'streamTestService' },
      aggregate: { name: 'StreamTestAggregate' },
      fromRevision: firstRevision,
    }

    const filteredStream = await events.getEventStream({
      payload: JSON.stringify(streamRequest),
    })

    const filteredEvents = []
    for await (const response of filteredStream) {
      filteredEvents.push(response.event)
    }

    // TODO: use debug library to log
    debug(
      'Filtered events revisions:',
      filteredEvents.map((e) => e.metadata.revision),
    )

    // Should get only the second event (revision > firstRevision)
    expect(filteredEvents).toHaveLength(1)
    expect(filteredEvents[0].id).toBe('stream-test-event-2')
    expect(filteredEvents[0].metadata.revision).toBeGreaterThan(firstRevision)
  }, 10000)
})
