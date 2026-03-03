import { describe, it, expect, afterEach } from 'vitest'
import { APIError } from 'encore.dev/api'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import { getGame } from '~src/services/ticTacToe/api/getGame'
import { createGame } from '~src/services/ticTacToe/api/createGame'

describe('getGame', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should return aggregate when it exists', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    const result = await getGame({
      id: created.id,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.id).toBe(created.id)
    expect(result.aggregate.status).toBe('inProgress')
  })

  it('should throw NotFound error when aggregate does not exist', async () => {
    const nonExistentId = generateId({ mode: 'random' })

    await expect(
      getGame({
        id: nonExistentId,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })
})
