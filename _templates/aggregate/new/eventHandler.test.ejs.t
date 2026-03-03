---
to: src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/events/<%= eventName %>/on<%= eventName %>.test.ts
---
import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase.ts'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import { <%= eventName %>Event } from './<%= eventName %>Event'
import { load<%= aggregateName %>Aggregate } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/load<%= aggregateName %>Aggregate'

describe('on<%= eventName %>', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  // Clean up test data after each test
  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should create a new aggregate when none exists', async () => {
    const aggregateId = generateId({ mode: 'random' })
    const eventId = generateId({ mode: 'random' })

    const testEvent: <%= eventName %>Event = {
      id: eventId,
      name: '<%= eventName %>',
      version: 1,
      aggregate: {
        name: '<%= aggregateName %>',
        id: aggregateId,
        service: { name: '<%= serviceName %>' },
      },
      data: {
        // TODO: Add appropriate test data for this event
      },
    }

    // Commit the event to create aggregate state
    await events.commitTransaction({
      events: [testEvent],
      namespace: testNamespace,
    })

    // Load the aggregate to verify it was created
    const loadedAggregate = await load<%= aggregateName %>Aggregate({
      id: aggregateId,
      namespace: testNamespace,
    })

    expect(loadedAggregate).not.toBeNull()
    expect(loadedAggregate?.id).toBe(aggregateId)
  })

  it('should handle existing aggregate state', async () => {
    const aggregateId = generateId({ mode: 'random' })
    const firstEventId = generateId({ mode: 'random' })
    const secondEventId = generateId({ mode: 'random' })

    // First event to create initial aggregate state
    const firstEvent: <%= eventName %>Event = {
      id: firstEventId,
      name: '<%= eventName %>',
      version: 1,
      aggregate: {
        name: '<%= aggregateName %>',
        id: aggregateId,
        service: { name: '<%= serviceName %>' },
      },
      data: {
        // TODO: Add appropriate test data for this event
      },
    }

    // Second event to test updating existing aggregate
    const secondEvent: <%= eventName %>Event = {
      id: secondEventId,
      name: '<%= eventName %>',
      version: 1,
      aggregate: {
        name: '<%= aggregateName %>',
        id: aggregateId,
        service: { name: '<%= serviceName %>' },
      },
      data: {
        // TODO: Add appropriate test data for this event
      },
    }

    // Commit the first event to create initial state
    await events.commitTransaction({
      events: [firstEvent],
      namespace: testNamespace,
    })

    // Commit the second event to update existing aggregate
    await events.commitTransaction({
      events: [secondEvent],
      namespace: testNamespace,
    })

    // Load the aggregate to verify it handles existing state
    const loadedAggregate = await load<%= aggregateName %>Aggregate({
      id: aggregateId,
      namespace: testNamespace,
    })

    expect(loadedAggregate).not.toBeNull()
    expect(loadedAggregate?.id).toBe(aggregateId)
  })
})
