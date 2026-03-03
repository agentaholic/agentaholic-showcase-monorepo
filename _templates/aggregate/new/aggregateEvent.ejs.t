---
to: src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/<%= aggregateName %>Event.ts
---
import { <%= eventName %>Event } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/events/<%= eventName %>/<%= eventName %>Event'
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports

// prettier-ignore
export type <%= aggregateName %>Event =
  | <%= eventName %>Event 
  // DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new event types