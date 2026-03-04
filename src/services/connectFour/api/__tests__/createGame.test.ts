import { describe, it, expect, afterEach } from 'vitest'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { createGame } from '~src/services/connectFour/api/createGame'
import { loadGameAggregate } from '~src/services/connectFour/aggregates/Game/loadGameAggregate'

describe('createGame', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should create a game and return aggregate id', async () => {
    const result = await createGame({ namespaceSlug: testNamespace.slug })

    expect(result.aggregate.id).toBeDefined()
    expect(typeof result.aggregate.id).toBe('string')
  })

  it('should create a game with Red as first player and empty 6x7 board', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    const aggregate = await loadGameAggregate({
      id: created.id,
      namespace: testNamespace,
    })

    if (aggregate == null) throw new Error('aggregate should not be null')
    expect(aggregate.status).toBe('inProgress')
    expect(aggregate.currentTurn).toBe('Red')
    expect(aggregate.board).toHaveLength(6)
    for (const row of aggregate.board) {
      expect(row).toHaveLength(7)
      for (const cell of row) {
        expect(cell).toBeNull()
      }
    }
  })
})
