import { describe, it, expect, afterEach } from 'vitest'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { createRound } from '~src/services/hangman/api/createRound'
import { getRound } from '~src/services/hangman/api/getRound'

describe('createRound', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should create a round and return an aggregate ID', async () => {
    const result = await createRound({ namespaceSlug: testNamespace.slug })

    expect(result.aggregate.id).toBeDefined()
    expect(typeof result.aggregate.id).toBe('string')
  })

  it('should create a round with status inProgress', async () => {
    const { aggregate: created } = await createRound({
      namespaceSlug: testNamespace.slug,
    })

    const result = await getRound({
      id: created.id,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('inProgress')
  })
})
