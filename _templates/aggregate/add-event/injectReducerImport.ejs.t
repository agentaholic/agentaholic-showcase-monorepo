---
to: src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/<%= h.changeCase.camel(aggregateName) %>AggregateReducer.ts
inject: true
before: '// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports'
---
import { on<%= eventName %> } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/events/<%= eventName %>/on<%= eventName %>' 