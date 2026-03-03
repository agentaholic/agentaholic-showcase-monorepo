---
to: src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/<%= aggregateName %>Event.ts
inject: true
before: '// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports'
---
import { <%= eventName %>Event } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/events/<%= eventName %>/<%= eventName %>Event' 