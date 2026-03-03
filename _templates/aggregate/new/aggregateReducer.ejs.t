---
to: src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/<%= h.changeCase.camel(aggregateName) %>AggregateReducer.ts
---
import { <%= aggregateName %>Aggregate } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/types/<%= aggregateName %>Aggregate'
import { <%= aggregateName %>Event } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/<%= aggregateName %>Event'
import { on<%= eventName %> } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/events/<%= eventName %>/on<%= eventName %>'
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports

export const <%= h.changeCase.camel(aggregateName) %>AggregateReducer = (
  aggregate: <%= aggregateName %>Aggregate | null,
  event: <%= aggregateName %>Event,
): <%= aggregateName %>Aggregate | null => {
  switch (event.name) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case '<%= eventName %>':
      return on<%= eventName %>(aggregate, event)

    // DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new event handlers
  }
}