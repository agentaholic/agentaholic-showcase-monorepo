import { describe, it, expect, afterEach } from 'vitest'
import { APIError } from 'encore.dev/api'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import { createGame } from '~src/services/connectFour/api/createGame'
import { getGame } from '~src/services/connectFour/api/getGame'

describe('getGame', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should return the aggregate by id', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    const result = await getGame({
      id: created.id,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.id).toBe(created.id)
    expect(result.aggregate.status).toBe('inProgress')
    expect(result.aggregate.currentTurn).toBe('Red')
  })

  it('should throw NotFound when game does not exist', async () => {
    await expect(
      getGame({
        id: generateId({ mode: 'random' }),
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })
})
