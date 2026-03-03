import type { ProjectionConfig } from '~src/types/architecture/ProjectionConfig'
import type { ProjectionWriter } from '~src/types/architecture/ProjectionWriter'

type ProjectionEvent = {
  aggregate: { id: string | number }
  metadata: {
    namespace: { slug: string }
    revision: number
  }
}

type EventStreamFetcher<TEvent extends ProjectionEvent> = (params: {
  namespace: { slug: string }
  service: { name: string }
  aggregate: { name: string }
  fromRevision: number
}) => AsyncIterable<{ event: TEvent }>

export type CreateProjectionParams<
  TEvent extends ProjectionEvent,
  TAggregate extends { id: string },
> = {
  projection: {
    config: ProjectionConfig
    writer: ProjectionWriter<TAggregate>
    reducer: (aggregate: TAggregate | null, event: TEvent) => TAggregate | null
    fetchEventStream: EventStreamFetcher<TEvent>
  }
}

export type Projection = {
  initialize: () => Promise<void>
  sync: (params: { namespace: { slug: string } }) => Promise<void>
}

export const createProjection = <
  TEvent extends ProjectionEvent,
  TAggregate extends { id: string },
>(
  params: CreateProjectionParams<TEvent, TAggregate>,
): Projection => {
  const { projection } = params
  const { config, writer, reducer, fetchEventStream } = projection

  // In-memory revision tracking per namespace
  const lastProcessedRevision = new Map<string, number>()

  // In-progress sync operations per namespace (for mutual exclusion)
  const syncInProgress = new Map<string, Promise<void>>()

  const processEvent = async (
    namespace: { slug: string },
    event: TEvent,
  ): Promise<void> => {
    const aggregateId = String(event.aggregate.id)

    const currentAggregate = await writer.aggregates.get({
      projectionConfig: config,
      namespace,
      aggregate: { id: aggregateId },
    })

    const newAggregate = reducer(currentAggregate, event)

    if (newAggregate === null) {
      if (currentAggregate !== null) {
        await writer.aggregates.delete({
          projectionConfig: config,
          namespace,
          aggregate: { id: aggregateId },
        })
      }
    } else {
      await writer.aggregates.save({
        projectionConfig: config,
        namespace,
        aggregate: newAggregate,
      })
    }
  }

  const doSync = async (namespace: { slug: string }): Promise<void> => {
    const fromRevision = lastProcessedRevision.get(namespace.slug) ?? 0

    const stream = fetchEventStream({
      namespace,
      service: config.service,
      aggregate: { name: config.aggregate.name },
      fromRevision,
    })

    let maxRevision = fromRevision

    for await (const response of stream) {
      const event = response.event
      await processEvent(namespace, event)

      if (event.metadata.revision > maxRevision) {
        maxRevision = event.metadata.revision
      }
    }

    lastProcessedRevision.set(namespace.slug, maxRevision)
  }

  return {
    initialize: async (): Promise<void> => {
      await writer.initialize({ projectionConfig: config })
    },

    sync: async ({ namespace }): Promise<void> => {
      // Check if a sync is already in progress for this namespace
      const existingSync = syncInProgress.get(namespace.slug)
      if (existingSync) {
        // Wait for the existing sync to complete instead of starting a new one
        await existingSync
        return
      }

      // Start a new sync and track it
      const syncPromise = doSync(namespace).finally(() => {
        // Clean up when done (whether successful or not)
        syncInProgress.delete(namespace.slug)
      })
      syncInProgress.set(namespace.slug, syncPromise)

      await syncPromise
    },
  }
}
