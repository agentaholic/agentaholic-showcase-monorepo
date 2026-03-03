import { ProjectionConfig } from '~src/types/architecture/ProjectionConfig'

export type ProjectionWriter<T extends { id: string }> = {
  initialize: (params: { projectionConfig: ProjectionConfig }) => Promise<void>

  aggregates: {
    get: (params: {
      projectionConfig: ProjectionConfig
      namespace: { slug: string }
      aggregate: { id: string }
    }) => Promise<T | null>

    save: (params: {
      projectionConfig: ProjectionConfig
      namespace: { slug: string }
      aggregate: T
    }) => Promise<void>

    delete: (params: {
      projectionConfig: ProjectionConfig
      namespace: { slug: string }
      aggregate: { id: string }
    }) => Promise<void>

    deleteAll: (params: {
      projectionConfig: ProjectionConfig
      namespace: { slug: string }
    }) => Promise<void>
  }
}
