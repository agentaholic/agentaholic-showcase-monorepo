import type { Surreal } from 'surrealdb'
import { RecordId } from 'surrealdb'
import type { ProjectionConfig } from '~src/types/architecture/ProjectionConfig'
import type { ProjectionWriter } from '~src/types/architecture/ProjectionWriter'

export const createSurrealProjectionWriter = <
  T extends { id: string },
>(params: {
  database: Surreal
}): ProjectionWriter<T> => {
  const { database } = params

  const getTableName = (config: ProjectionConfig): string =>
    `${config.service.name}_${config.aggregate.name}`

  const getRecordId = (
    tableName: string,
    namespace: { slug: string },
    aggregateId: string,
  ): RecordId => new RecordId(tableName, `${namespace.slug}:${aggregateId}`)

  return {
    initialize: async () => {
      // No-op: SurrealDB creates tables on first insert
    },

    aggregates: {
      get: async ({ projectionConfig, namespace, aggregate }) => {
        const tableName = getTableName(projectionConfig)
        const recordId = getRecordId(tableName, namespace, aggregate.id)
        // SurrealDB types say this returns T, but at runtime it returns undefined for non-existent records
        const result = (await database.select<T>(recordId)) as T | undefined
        if (!result) return null
        // SurrealDB returns the full record ID as the 'id' field - restore original aggregate ID
        return { ...result, id: aggregate.id }
      },

      save: async ({ projectionConfig, namespace, aggregate }) => {
        const tableName = getTableName(projectionConfig)
        const compositeId = `${namespace.slug}:${aggregate.id}`
        // Remove the 'id' field from aggregate to avoid conflict with SurrealDB record ID
        const { id: _id, ...dataWithoutId } = aggregate
        await database.query(`UPSERT type::thing($table, $id) CONTENT $data`, {
          table: tableName,
          id: compositeId,
          data: dataWithoutId,
        })
      },

      delete: async ({ projectionConfig, namespace, aggregate }) => {
        const tableName = getTableName(projectionConfig)
        const recordId = getRecordId(tableName, namespace, aggregate.id)
        await database.delete(recordId)
      },

      deleteAll: async ({ projectionConfig, namespace }) => {
        const tableName = getTableName(projectionConfig)
        await database.query(
          `DELETE FROM type::table($table) WHERE string::starts_with(<string>record::id(id), $prefix)`,
          { table: tableName, prefix: `${namespace.slug}:` },
        )
      },
    },
  }
}
