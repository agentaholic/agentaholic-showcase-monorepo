import { events } from '~encore/clients'
import type { NamespaceEvent } from '~src/services/events/types/NamespaceEvent'

export interface LoadAggregateParams<
  TEvent,
  TAggregate,
  Id extends string | number = string,
> {
  namespace: { slug: string }
  service: { name: string }
  name: string
  id: Id
  reducer: (
    aggregate: TAggregate | null,
    event: NamespaceEvent<TEvent>,
  ) => TAggregate | null
  useNumericAggregateId?: boolean
}

export async function loadAggregate<
  TEvent,
  TAggregate,
  Id extends string | number = string,
>({
  namespace,
  service,
  name,
  id,
  reducer,
  useNumericAggregateId,
}: LoadAggregateParams<TEvent, TAggregate, Id>): Promise<TAggregate | null> {
  // Prepare the request payload for getEventStream
  const request = {
    namespace,
    service,
    aggregate: {
      name,
      id,
    },
    useNumericAggregateId,
  }

  // Call the events.getEventStream endpoint
  const stream = await events.getEventStream({
    payload: JSON.stringify(request),
  })

  let aggregate: TAggregate | null = null

  // Process each event in the stream using the reducer
  for await (const response of stream) {
    // Cast the event to the expected type since BaseDomainEvent uses unknown for data
    const event = response.event as unknown as NamespaceEvent<TEvent>
    aggregate = reducer(aggregate, event)
  }

  return aggregate
}
