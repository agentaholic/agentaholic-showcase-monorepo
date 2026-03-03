---
to: src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/events/<%= eventName %>/on<%= eventName %>.ts
---
import { <%= aggregateName %>Aggregate } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/types/<%= aggregateName %>Aggregate'
import { <%= eventName %>Event } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/events/<%= eventName %>/<%= eventName %>Event'

export const on<%= eventName %> = (
  _aggregate: <%= aggregateName %>Aggregate | null,
  event: <%= eventName %>Event,
): <%= aggregateName %>Aggregate | null => {
  return {
    id: event.aggregate.id,
    // TODO: Implement event handling logic here
  }
} 