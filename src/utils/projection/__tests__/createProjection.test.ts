import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createProjection } from '~src/utils/projection/createProjection'
import type { ProjectionConfig } from '~src/types/architecture/ProjectionConfig'
import type { ProjectionWriter } from '~src/types/architecture/ProjectionWriter'

type TestEvent = {
  name: string
  aggregate: { id: string }
  data: { value: number }
  metadata: {
    namespace: { slug: string }
    revision: number
  }
}

type TestAggregate = {
  id: string
  total: number
  eventCount: number
}

// Helper to convert sync iterable to async iterable
const toAsyncIterable = <T>(items: T[]): AsyncIterable<T> => ({
  [Symbol.asyncIterator]: async function* () {
    for (const item of items) {
      yield await Promise.resolve(item)
    }
  },
})

// Helper for empty async iterable
const emptyAsyncIterable = <T>(): AsyncIterable<T> => ({
  // eslint-disable-next-line require-yield
  [Symbol.asyncIterator]: async function* () {
    await Promise.resolve()
  },
})

describe('createProjection', () => {
  const projectionConfig: ProjectionConfig = {
    service: { name: 'payments' },
    aggregate: { name: 'Payment' },
  }

  const namespace = { slug: 'main' }

  const createMockWriter = (): ProjectionWriter<TestAggregate> => ({
    initialize: vi.fn(),
    aggregates: {
      get: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      deleteAll: vi.fn(),
    },
  })

  const testReducer = (
    aggregate: TestAggregate | null,
    event: TestEvent,
  ): TestAggregate | null => {
    if (event.name === 'Deleted') {
      return null
    }

    const current = aggregate ?? {
      id: event.aggregate.id,
      total: 0,
      eventCount: 0,
    }
    return {
      ...current,
      total: current.total + event.data.value,
      eventCount: current.eventCount + 1,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialize', () => {
    it('should call writer.initialize with projectionConfig', async () => {
      const mockWriter = createMockWriter()

      const projection = createProjection<TestEvent, TestAggregate>({
        projection: {
          config: projectionConfig,
          writer: mockWriter,
          reducer: testReducer,
          fetchEventStream: () => emptyAsyncIterable(),
        },
      })

      await projection.initialize()

      expect(mockWriter.initialize).toHaveBeenCalledTimes(1)
      expect(mockWriter.initialize).toHaveBeenCalledWith({
        projectionConfig,
      })
    })
  })

  describe('sync', () => {
    it('should process events and save aggregates', async () => {
      const mockWriter = createMockWriter()
      vi.mocked(mockWriter.aggregates.get).mockResolvedValue(null)

      const events = [
        {
          event: {
            name: 'Created',
            aggregate: { id: 'agg_1' },
            data: { value: 100 },
            metadata: { namespace, revision: 1 },
          },
        },
      ]

      const projection = createProjection<TestEvent, TestAggregate>({
        projection: {
          config: projectionConfig,
          writer: mockWriter,
          reducer: testReducer,
          fetchEventStream: () => toAsyncIterable(events),
        },
      })

      await projection.sync({ namespace })

      expect(mockWriter.aggregates.get).toHaveBeenCalledWith({
        projectionConfig,
        namespace,
        aggregate: { id: 'agg_1' },
      })
      expect(mockWriter.aggregates.save).toHaveBeenCalledWith({
        projectionConfig,
        namespace,
        aggregate: { id: 'agg_1', total: 100, eventCount: 1 },
      })
    })

    it('should handle multiple events for the same aggregate sequentially', async () => {
      const mockWriter = createMockWriter()
      let currentAggregate: TestAggregate | null = null

      vi.mocked(mockWriter.aggregates.get).mockImplementation(() =>
        Promise.resolve(currentAggregate),
      )
      vi.mocked(mockWriter.aggregates.save).mockImplementation(
        ({ aggregate }) => {
          currentAggregate = aggregate
          return Promise.resolve()
        },
      )

      const events = [
        {
          event: {
            name: 'Created',
            aggregate: { id: 'agg_1' },
            data: { value: 100 },
            metadata: { namespace, revision: 1 },
          },
        },
        {
          event: {
            name: 'Updated',
            aggregate: { id: 'agg_1' },
            data: { value: 50 },
            metadata: { namespace, revision: 2 },
          },
        },
        {
          event: {
            name: 'Updated',
            aggregate: { id: 'agg_1' },
            data: { value: 25 },
            metadata: { namespace, revision: 3 },
          },
        },
      ]

      const projection = createProjection<TestEvent, TestAggregate>({
        projection: {
          config: projectionConfig,
          writer: mockWriter,
          reducer: testReducer,
          fetchEventStream: () => toAsyncIterable(events),
        },
      })

      await projection.sync({ namespace })

      expect(mockWriter.aggregates.save).toHaveBeenCalledTimes(3)
      expect(currentAggregate).toEqual({
        id: 'agg_1',
        total: 175,
        eventCount: 3,
      })
    })

    it('should track revision and only process new events on subsequent calls', async () => {
      const mockWriter = createMockWriter()
      vi.mocked(mockWriter.aggregates.get).mockResolvedValue(null)

      let callCount = 0

      type FetchParams = {
        namespace: { slug: string }
        service: { name: string }
        aggregate: { name: string }
        fromRevision: number
      }

      const fetchEventStream = vi
        .fn()
        .mockImplementation((params: FetchParams) => {
          callCount++

          if (callCount === 1) {
            // First sync: return events with revisions 1-2
            return toAsyncIterable([
              {
                event: {
                  name: 'Created',
                  aggregate: { id: 'agg_1' },
                  data: { value: 100 },
                  metadata: { namespace, revision: 1 },
                },
              },
              {
                event: {
                  name: 'Updated',
                  aggregate: { id: 'agg_1' },
                  data: { value: 50 },
                  metadata: { namespace, revision: 2 },
                },
              },
            ])
          } else if (callCount === 2) {
            // Second sync: should request fromRevision 2, return event with revision 3
            expect(params.fromRevision).toBe(2)
            return toAsyncIterable([
              {
                event: {
                  name: 'Updated',
                  aggregate: { id: 'agg_1' },
                  data: { value: 25 },
                  metadata: { namespace, revision: 3 },
                },
              },
            ])
          }
          return emptyAsyncIterable()
        })

      const projection = createProjection<TestEvent, TestAggregate>({
        projection: {
          config: projectionConfig,
          writer: mockWriter,
          reducer: testReducer,
          fetchEventStream,
        },
      })

      // First sync
      await projection.sync({ namespace })
      expect(fetchEventStream).toHaveBeenCalledWith(
        expect.objectContaining({ fromRevision: 0 }),
      )

      // Second sync should start from revision 2
      await projection.sync({ namespace })
      expect(fetchEventStream).toHaveBeenCalledTimes(2)
    })

    it('should delete aggregate when reducer returns null', async () => {
      const mockWriter = createMockWriter()
      const existingAggregate: TestAggregate = {
        id: 'agg_1',
        total: 100,
        eventCount: 1,
      }
      vi.mocked(mockWriter.aggregates.get).mockResolvedValue(existingAggregate)

      const events = [
        {
          event: {
            name: 'Deleted',
            aggregate: { id: 'agg_1' },
            data: { value: 0 },
            metadata: { namespace, revision: 2 },
          },
        },
      ]

      const projection = createProjection<TestEvent, TestAggregate>({
        projection: {
          config: projectionConfig,
          writer: mockWriter,
          reducer: testReducer,
          fetchEventStream: () => toAsyncIterable(events),
        },
      })

      await projection.sync({ namespace })

      expect(mockWriter.aggregates.delete).toHaveBeenCalledWith({
        projectionConfig,
        namespace,
        aggregate: { id: 'agg_1' },
      })
      expect(mockWriter.aggregates.save).not.toHaveBeenCalled()
    })

    it('should not call delete when reducer returns null for non-existent aggregate', async () => {
      const mockWriter = createMockWriter()
      vi.mocked(mockWriter.aggregates.get).mockResolvedValue(null)

      const events = [
        {
          event: {
            name: 'Deleted',
            aggregate: { id: 'agg_non_existent' },
            data: { value: 0 },
            metadata: { namespace, revision: 1 },
          },
        },
      ]

      const projection = createProjection<TestEvent, TestAggregate>({
        projection: {
          config: projectionConfig,
          writer: mockWriter,
          reducer: testReducer,
          fetchEventStream: () => toAsyncIterable(events),
        },
      })

      await projection.sync({ namespace })

      expect(mockWriter.aggregates.delete).not.toHaveBeenCalled()
      expect(mockWriter.aggregates.save).not.toHaveBeenCalled()
    })

    it('should handle empty event stream gracefully', async () => {
      const mockWriter = createMockWriter()

      const projection = createProjection<TestEvent, TestAggregate>({
        projection: {
          config: projectionConfig,
          writer: mockWriter,
          reducer: testReducer,
          fetchEventStream: () => emptyAsyncIterable(),
        },
      })

      await projection.sync({ namespace })

      expect(mockWriter.aggregates.get).not.toHaveBeenCalled()
      expect(mockWriter.aggregates.save).not.toHaveBeenCalled()
      expect(mockWriter.aggregates.delete).not.toHaveBeenCalled()
    })

    it('should pass correct parameters to fetchEventStream', async () => {
      const mockWriter = createMockWriter()
      const fetchEventStream = vi.fn().mockImplementation(() => {
        return emptyAsyncIterable<{ event: TestEvent }>()
      })

      const projection = createProjection<TestEvent, TestAggregate>({
        projection: {
          config: projectionConfig,
          writer: mockWriter,
          reducer: testReducer,
          fetchEventStream,
        },
      })

      await projection.sync({ namespace })

      expect(fetchEventStream).toHaveBeenCalledWith({
        namespace,
        service: { name: 'payments' },
        aggregate: { name: 'Payment' },
        fromRevision: 0,
      })
    })

    it('should handle numeric aggregate IDs by converting to string', async () => {
      type NumericIdEvent = {
        name: string
        aggregate: { id: number }
        data: { value: number }
        metadata: {
          namespace: { slug: string }
          revision: number
        }
      }

      const mockWriter = createMockWriter()
      vi.mocked(mockWriter.aggregates.get).mockResolvedValue(null)

      const numericReducer = (
        aggregate: TestAggregate | null,
        event: NumericIdEvent,
      ): TestAggregate => {
        const current = aggregate ?? {
          id: String(event.aggregate.id),
          total: 0,
          eventCount: 0,
        }
        return {
          ...current,
          total: current.total + event.data.value,
          eventCount: current.eventCount + 1,
        }
      }

      const events = [
        {
          event: {
            name: 'Created',
            aggregate: { id: 12345 },
            data: { value: 100 },
            metadata: { namespace, revision: 1 },
          },
        },
      ]

      const projection = createProjection<NumericIdEvent, TestAggregate>({
        projection: {
          config: projectionConfig,
          writer: mockWriter,
          reducer: numericReducer,
          fetchEventStream: () => toAsyncIterable(events),
        },
      })

      await projection.sync({ namespace })

      expect(mockWriter.aggregates.get).toHaveBeenCalledWith({
        projectionConfig,
        namespace,
        aggregate: { id: '12345' },
      })
    })
  })
})
