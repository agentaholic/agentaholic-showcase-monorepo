---
to: src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/load<%= aggregateName %>Aggregate.ts
---
import { <%= aggregateName %>Aggregate } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/types/<%= aggregateName %>Aggregate'
import { loadAggregate } from '~src/services/events/utils/loadAggregate'
import { <%= aggregateName %>Event } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/<%= aggregateName %>Event'
import { <%= h.changeCase.camel(aggregateName) %>AggregateReducer } from './<%= h.changeCase.camel(aggregateName) %>AggregateReducer'

export async function load<%= aggregateName %>Aggregate(params: {
  id: string
  namespace: { slug: string }
}): Promise<<%= aggregateName %>Aggregate | null> {
  return loadAggregate<
    <%= aggregateName %>Event,
    <%= aggregateName %>Aggregate
  >({
    ...params,
    service: { name: '<%= serviceName %>' },
    name: '<%= aggregateName %>',
    reducer: <%= h.changeCase.camel(aggregateName) %>AggregateReducer,
  })
} 