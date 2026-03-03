/* v8 ignore start */
import { Surreal } from 'surrealdb'
import { surrealdbNodeEngines } from '@surrealdb/node'
import { appMeta } from 'encore.dev'

/**
 * This is the database that will be used to store the projections.
 *
 * It is a separate database from the events database, which is a persistent
 * postgres database that usually ends up in a cloud provider.
 *
 * This database is a temporary database that is used to store the projections.
 * It is not persistent, and in production, it uses SurrealKV to store data both
 * in memory and on disk.
 *
 * In development, it uses the SurrealDB in-memory database.
 *
 * Each service may have any number of projections, with each projection storing
 * aggregates in a projection-specific table of JSON objects.
 */

export const projectionsDatabase = new Surreal({
  engines: surrealdbNodeEngines(),
})

await projectionsDatabase.connect(
  appMeta().environment.type === 'production'
    ? 'surrealkv://agentaholic-showcase-projections'
    : 'mem://',
  {
    namespace: 'default',
    database: 'projections',
  },
)
/* v8 ignore stop */
