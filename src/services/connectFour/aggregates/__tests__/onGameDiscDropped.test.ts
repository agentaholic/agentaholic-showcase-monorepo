import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { GameStartedEvent } from '~src/services/connectFour/aggregates/Game/events/GameStarted/GameStartedEvent'
import type { GameDiscDroppedEvent } from '~src/services/connectFour/aggregates/Game/events/GameDiscDropped/GameDiscDroppedEvent'
import { loadGameAggregate } from '~src/services/connectFour/aggregates/Game/loadGameAggregate'

describe('onGameDiscDropped', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should place a disc on the board and switch turns', async () => {
    const game = { id: generateId({ mode: 'random' }) }

    const startEvent: GameStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameStarted',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'connectFour' },
      },
      data: { firstPlayer: 'Red' },
    }

    const dropEvent: GameDiscDroppedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameDiscDropped',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'connectFour' },
      },
      data: { player: 'Red', row: 5, column: 3 },
    }

    await events.commitTransaction({
      events: [startEvent, dropEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.board[5][3]).toBe('Red')
    expect(aggregate?.currentTurn).toBe('Yellow')
    expect(aggregate?.moves).toEqual([{ player: 'Red', row: 5, column: 3 }])
  })

  it('should handle multiple disc drops', async () => {
    const game = { id: generateId({ mode: 'random' }) }

    const startEvent: GameStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameStarted',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'connectFour' },
      },
      data: { firstPlayer: 'Red' },
    }

    const drop1: GameDiscDroppedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameDiscDropped',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'connectFour' },
      },
      data: { player: 'Red', row: 5, column: 0 },
    }

    const drop2: GameDiscDroppedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameDiscDropped',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'connectFour' },
      },
      data: { player: 'Yellow', row: 5, column: 1 },
    }

    await events.commitTransaction({
      events: [startEvent, drop1, drop2],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.board[5][0]).toBe('Red')
    expect(aggregate?.board[5][1]).toBe('Yellow')
    expect(aggregate?.currentTurn).toBe('Red')
    expect(aggregate?.moves).toHaveLength(2)
  })
})
