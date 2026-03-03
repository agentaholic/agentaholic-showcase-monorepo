import { api, StreamOut } from 'encore.dev/api'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { BaseDomainEvent } from '~src/services/events/types/BaseDomainEvent'

export interface GetEventStreamRequest {
  namespace?: { slug: string }
  service: { name: string }
  aggregate: {
    name: string
    id?: string | number // Optional aggregate ID
  }
  fromRevision?: number // Optional revision number to filter from
  useNumericAggregateId?: boolean
}

export interface GetEventStreamResponse {
  event: BaseDomainEvent & {
    metadata: BaseDomainEvent['metadata'] & { revision: number }
  }
}

export const getEventStream = api.streamOut<
  // Instead of using GetEventStreamRequest directly, we use a string payload
  // This is because Encore doesn't support passing objects directly to streamOut
  // We parse the string payload into a GetEventStreamRequest object
  { payload: string },
  GetEventStreamResponse
>(
  {
    expose: false,
  },
  async (
    { payload }: { payload: string },
    stream: StreamOut<GetEventStreamResponse>,
  ): Promise<void> => {
    const req = JSON.parse(payload) as GetEventStreamRequest

    // Build the SQL query using template literals
    const baseQuery = `
        SELECT
          id,
          service_name,
          aggregate_name,
          aggregate_id,
          namespace_slug,
          transaction_id,
          data,
          revision
        FROM events
        WHERE service_name = $1
          AND aggregate_name = $2
      `

    let finalQuery = baseQuery
    const params: string[] = [req.service.name, req.aggregate.name]

    // Add namespace filter if provided
    if (req.namespace) {
      finalQuery += ` AND namespace_slug = $${params.length + 1}`
      params.push(req.namespace.slug)
    }

    // Add aggregate ID filter if provided
    if (req.aggregate.id) {
      finalQuery += ` AND aggregate_id = $${params.length + 1}`
      params.push(String(req.aggregate.id))
    }

    // Add fromRevision filter if provided
    if (req.fromRevision != null) {
      finalQuery += ` AND revision > ${req.fromRevision}`
      // for some reson, when there is an additional param here, the query
      // slows down extremely and it doesn't seem to even parse the param correctly
      // finalQuery += ` AND revision > $${(params.length + 1)}`
      // params.push(req.fromRevision)
    }

    // Always order by revision to maintain event sequence
    finalQuery += ` ORDER BY revision ASC`

    // Execute the query using rawQuery with parameters
    const result = eventsDatabase.rawQuery(finalQuery, ...params)

    // Stream each event in order
    for await (const row of result) {
      const eventData = row.data as BaseDomainEvent

      // Reconstruct the event with proper structure
      const domainEvent: BaseDomainEvent & {
        metadata: BaseDomainEvent['metadata'] & { revision: number }
      } = {
        id: row.id as string,
        version: eventData.version,
        name: eventData.name,
        aggregate: {
          name: row.aggregate_name as string,
          id: req.useNumericAggregateId
            ? Number(row.aggregate_id as string)
            : (row.aggregate_id as string),
          service: { name: row.service_name as string },
        },
        data: eventData.data,
        metadata: {
          timestamp: eventData.metadata.timestamp,
          namespace: { slug: row.namespace_slug as string },
          transaction: { id: row.transaction_id as string },
          revision: row.revision as number,
          traceId: eventData.metadata.traceId,
          spanId: eventData.metadata.spanId,
        },
      }

      await stream.send({ event: domainEvent })
    }

    // TODO: consider error handling here because the stream might never close if an error occurs
    await stream.close()
  },
)
