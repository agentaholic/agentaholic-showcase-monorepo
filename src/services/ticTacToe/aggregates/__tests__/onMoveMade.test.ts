import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { GameStartedEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameStarted/GameStartedEvent'
import type { MoveMadeEvent } from '~src/services/ticTacToe/aggregates/Game/events/MoveMade/MoveMadeEvent'
import { loadGameAggregate } from '~src/services/ticTacToe/aggregates/Game/loadGameAggregate'

describe('onMoveMade', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should place a mark on the board and switch turns', async () => {
    const game = { id: generateId({ mode: 'random' }) }

    const startEvent: GameStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameStarted',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: { firstPlayer: 'X' },
    }

    const moveEvent: MoveMadeEvent = {
      id: generateId({ mode: 'random' }),
      name: 'MoveMade',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: { player: 'X', row: 0, column: 0 },
    }

    await events.commitTransaction({
      events: [startEvent, moveEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.board[0][0]).toBe('X')
    expect(aggregate?.currentTurn).toBe('O')
    expect(aggregate?.moves).toEqual([{ player: 'X', row: 0, column: 0 }])
  })

  it('should handle multiple moves', async () => {
    const game = { id: generateId({ mode: 'random' }) }

    const startEvent: GameStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameStarted',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: { firstPlayer: 'X' },
    }

    const move1: MoveMadeEvent = {
      id: generateId({ mode: 'random' }),
      name: 'MoveMade',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: { player: 'X', row: 0, column: 0 },
    }

    const move2: MoveMadeEvent = {
      id: generateId({ mode: 'random' }),
      name: 'MoveMade',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: { player: 'O', row: 1, column: 1 },
    }

    await events.commitTransaction({
      events: [startEvent, move1, move2],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.board[0][0]).toBe('X')
    expect(aggregate?.board[1][1]).toBe('O')
    expect(aggregate?.currentTurn).toBe('X')
    expect(aggregate?.moves).toHaveLength(2)
  })
})
