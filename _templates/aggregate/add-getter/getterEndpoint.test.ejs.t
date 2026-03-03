---
to: src/services/<%= serviceName %>/api/get<%= aggregateName %>.test.ts
---
import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import { get<%= aggregateName %> } from '~src/services/<%= serviceName %>/api/get<%= aggregateName %>'
import { load<%= aggregateName %>Aggregate } from '~src/services/<%= serviceName %>/aggregates/<%= aggregateName %>/load<%= aggregateName %>Aggregate'
import { APIError } from 'encore.dev/api'

describe('get<%= aggregateName %>', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  // Clean up test data after each test
  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should return aggregate when it exists', async () => {
    const aggregateId = generateId({ mode: 'random' })

    // Create test events to establish aggregate state
    // Note: You'll need to create appropriate test events based on your aggregate's events
    // This is a placeholder - replace with actual event creation logic
    const testEvent = {
      id: generateId({ mode: 'random' }),
      name: 'TestEvent', // Replace with actual event name
      version: 1,
      aggregate: {
        name: '<%= aggregateName %>',
        id: aggregateId,
        service: { name: '<%= serviceName %>' },
      },
      data: {
        // Add appropriate test data
      },
    }

    // Commit event to create aggregate state
    await events.commitTransaction({
      events: [testEvent],
      namespace: testNamespace,
    })

    // Verify aggregate exists
    const existingAggregate = await load<%= aggregateName %>Aggregate({
      id: aggregateId,
      namespace: testNamespace,
    })
    expect(existingAggregate).not.toBeNull()

    // Call the getter endpoint
    const result = await get<%= aggregateName %>({
      id: aggregateId,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.id).toBe(aggregateId)
  })

  it('should throw NotFound error when aggregate does not exist', async () => {
    const nonExistentId = generateId({ mode: 'random' })

    await expect(
      get<%= aggregateName %>({
        id: nonExistentId,
        namespaceSlug: testNamespace.slug,
      })
    ).rejects.toThrow(APIError)

    try {
      await get<%= aggregateName %>({
        id: nonExistentId,
        namespaceSlug: testNamespace.slug,
      })
      // Should not reach this line
      expect(true).toBe(false)
    } catch (error) {
      expect(error).toBeInstanceOf(APIError)
      const apiError = error as APIError
      expect(apiError.message).toContain('<%= aggregateName %> with ID')
      expect(apiError.message).toContain('not found')
    }
  })

  it('should use default namespace when namespaceSlug is not provided', async () => {
    const aggregateId = generateId({ mode: 'random' })

    // Create test events in main namespace
    const testEvent = {
      id: generateId({ mode: 'random' }),
      name: 'TestEvent', // Replace with actual event name
      version: 1,
      aggregate: {
        name: '<%= aggregateName %>',
        id: aggregateId,
        service: { name: '<%= serviceName %>' },
      },
      data: {
        // Add appropriate test data
      },
    }

    // Commit event to main namespace
    await events.commitTransaction({
      events: [testEvent],
      namespace: { slug: 'main' },
    })

    // Call getter without namespaceSlug (should default to 'main')
    const result = await get<%= aggregateName %>({
      id: aggregateId,
    })

    expect(result.aggregate.id).toBe(aggregateId)

    // Clean up main namespace
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = 'main' AND aggregate_id = ${aggregateId}`
  })
})