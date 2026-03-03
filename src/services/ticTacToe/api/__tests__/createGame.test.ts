import { describe, it, expect, afterEach } from 'vitest'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { createGame } from '~src/services/ticTacToe/api/createGame'
import { loadGameAggregate } from '~src/services/ticTacToe/aggregates/Game/loadGameAggregate'

describe('createGame', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should create a new game and return the aggregate id', async () => {
    const result = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.id).toBeDefined()
    expect(typeof result.aggregate.id).toBe('string')

    const aggregate = await loadGameAggregate({
      id: result.aggregate.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.status).toBe('inProgress')
    expect(aggregate?.currentTurn).toBe('X')
    expect(aggregate?.board).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ])
    expect(aggregate?.winner).toBeNull()
    expect(aggregate?.moves).toEqual([])
  })
})
