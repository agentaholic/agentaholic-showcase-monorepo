import { afterEach, describe, expect, it } from 'vitest'
import { events } from '~encore/clients'
import {
  CommitTransactionRequest,
  InnerDomainEvent,
} from '~src/services/events/api/commitTransaction'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import {
  loadAggregate,
  LoadAggregateParams,
} from '~src/services/events/utils/loadAggregate'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'

// Test types for the aggregate
type BaseTestEvent = {
  id: string
  aggregate: {
    name: 'thing'
    id: string
    service: { name: 'testAggregateService' }
  }
  metadata: {
    namespace: { slug: string }
    timestamp: string
    transaction: { id: string }
  }
}

type TestEvent =
  | (BaseTestEvent & { name: 'ThingCreated'; data: { value: number } })
  | (BaseTestEvent & { name: 'ThingUpdated'; data: { value: number } })
  | (BaseTestEvent & { name: 'ThingDeleted'; data: null })

interface TestAggregate {
  id: string
  value: number
}

describe('loadAggregate', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }
  const testService = { name: 'testAggregateService' }
  const testAggregateName = 'TestAggregate'
  const testAggregateId = 'test-aggregate-1'

  // Clean up test data after each test
  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  // Test reducer function that builds up the aggregate from events
  const testReducer = (
    aggregate: TestAggregate | null,
    event: TestEvent,
  ): TestAggregate | null => {
    switch (event.name) {
      case 'ThingCreated':
        return {
          id: testAggregateId,
          value: event.data.value,
        }
      case 'ThingUpdated':
        if (!aggregate) return null
        return {
          ...aggregate,
          value: event.data.value,
        }
      case 'ThingDeleted':
        return null
      default:
        return aggregate
    }
  }

  const createTestEvent = (
    details: Pick<TestEvent, 'name' | 'data' | 'id'>,
  ): InnerDomainEvent => ({
    id: details.id,
    version: 1,
    name: details.name,
    aggregate: {
      name: testAggregateName,
      id: testAggregateId,
      service: testService,
    },
    data: details.data,
  })

  it('should load and build an aggregate from a single event', async () => {
    // Commit a test event
    const testEvent = createTestEvent({
      id: 'test-event-1',
      name: 'ThingCreated',
      data: {
        value: 100,
      },
    })

    const commitRequest: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
    }

    await events.commitTransaction(commitRequest)

    // Load the aggregate
    const loadParams: LoadAggregateParams<TestEvent, TestAggregate> = {
      namespace: testNamespace,
      service: testService,
      name: testAggregateName,
      id: testAggregateId,
      reducer: testReducer,
    }

    const result = await loadAggregate(loadParams)

    expect(result).toBeDefined()
    expect(result?.id).toBe(testAggregateId)
    expect(result?.value).toBe(100)
  })

  it('should load and build an aggregate from multiple events in sequence', async () => {
    // Commit multiple test events
    const testEvents = [
      createTestEvent({
        id: 'test-event-1',
        name: 'ThingCreated',
        data: {
          value: 50,
        },
      }),
      createTestEvent({
        id: 'test-event-2',
        name: 'ThingUpdated',
        data: {
          value: 75,
        },
      }),
      createTestEvent({
        id: 'test-event-3',
        name: 'ThingUpdated',
        data: {
          value: 100,
        },
      }),
    ]

    const commitRequest: CommitTransactionRequest = {
      events: testEvents,
      namespace: testNamespace,
    }

    await events.commitTransaction(commitRequest)

    // Load the aggregate
    const loadParams: LoadAggregateParams<TestEvent, TestAggregate> = {
      namespace: testNamespace,
      service: testService,
      name: testAggregateName,
      id: testAggregateId,
      reducer: testReducer,
    }

    const result = await loadAggregate(loadParams)

    expect(result).toBeDefined()
    expect(result?.id).toBe(testAggregateId)
    expect(result?.value).toBe(100)
  })

  it('should handle deletion events properly', async () => {
    // Commit events including a deletion
    const testEvents = [
      createTestEvent({
        id: 'test-event-1',
        name: 'ThingCreated',
        data: {
          value: 42,
        },
      }),
      createTestEvent({
        id: 'test-event-2',
        name: 'ThingDeleted',
        data: null,
      }),
    ]

    const commitRequest: CommitTransactionRequest = {
      events: testEvents,
      namespace: testNamespace,
    }

    await events.commitTransaction(commitRequest)

    // Load the aggregate
    const loadParams: LoadAggregateParams<TestEvent, TestAggregate> = {
      namespace: testNamespace,
      service: testService,
      name: testAggregateName,
      id: testAggregateId,
      reducer: testReducer,
    }

    const result = await loadAggregate(loadParams)

    expect(result).toBeNull()
  })

  it('should return null when no events exist for the aggregate', async () => {
    // Don't commit any events
    const loadParams: LoadAggregateParams<TestEvent, TestAggregate> = {
      namespace: testNamespace,
      service: testService,
      name: testAggregateName,
      id: testAggregateId,
      reducer: testReducer,
    }

    const result = await loadAggregate(loadParams)

    expect(result).toBeNull()
  })

  it('should return null when reducer returns null for all events', async () => {
    // Commit a test event
    const testEvent = createTestEvent({
      id: 'test-event-1',
      name: 'ThingUpdated',
      data: {
        value: 100,
      },
    })

    const commitRequest: CommitTransactionRequest = {
      events: [testEvent],
      namespace: testNamespace,
    }

    await events.commitTransaction(commitRequest)

    // Load the aggregate with a reducer that returns null for update events when no aggregate exists
    const loadParams: LoadAggregateParams<TestEvent, TestAggregate> = {
      namespace: testNamespace,
      service: testService,
      name: testAggregateName,
      id: testAggregateId,
      reducer: testReducer,
    }

    const result = await loadAggregate(loadParams)

    expect(result).toBeNull()
  })

  it('should handle complex event sequences correctly', async () => {
    // Commit a complex sequence of events
    const testEvents = [
      createTestEvent({
        id: 'test-event-1',
        name: 'ThingCreated',
        data: {
          value: 10,
        },
      }),
      createTestEvent({
        id: 'test-event-2',
        name: 'ThingUpdated',
        data: {
          value: 20,
        },
      }),
      createTestEvent({
        id: 'test-event-3',
        name: 'ThingUpdated',
        data: {
          value: 30,
        },
      }),
      createTestEvent({
        id: 'test-event-4',
        name: 'ThingUpdated',
        data: {
          value: 40,
        },
      }),
    ]

    const commitRequest: CommitTransactionRequest = {
      events: testEvents,
      namespace: testNamespace,
    }

    await events.commitTransaction(commitRequest)

    // Load the aggregate
    const loadParams: LoadAggregateParams<TestEvent, TestAggregate> = {
      namespace: testNamespace,
      service: testService,
      name: testAggregateName,
      id: testAggregateId,
      reducer: testReducer,
    }

    const result = await loadAggregate(loadParams)

    expect(result).toBeDefined()
    expect(result?.id).toBe(testAggregateId)
    expect(result?.value).toBe(40)
  })
})
