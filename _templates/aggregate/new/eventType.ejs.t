---
to: src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/events/<%= eventName %>/<%= eventName %>Event.ts
---
export type <%= eventName %>Event = {
  name: '<%= eventName %>'
  version: 1
  id: string
  aggregate: {
    name: '<%= aggregateName %>'
    id: string
    service: { name: '<%= serviceName %>' }
  }

  // TODO: Add event data properties here
  data: unknown
} 