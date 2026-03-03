import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { GameStartedEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameStarted/GameStartedEvent'
import { loadGameAggregate } from '~src/services/ticTacToe/aggregates/Game/loadGameAggregate'

describe('onGameStarted', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should create a new game with empty board and X as first player', async () => {
    const game = { id: generateId({ mode: 'random' }) }

    const testEvent: GameStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameStarted',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: {
        firstPlayer: 'X',
      },
    }

    await events.commitTransaction({
      events: [testEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.id).toBe(game.id)
    expect(aggregate?.board).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ])
    expect(aggregate?.currentTurn).toBe('X')
    expect(aggregate?.status).toBe('inProgress')
    expect(aggregate?.winner).toBeNull()
    expect(aggregate?.moves).toEqual([])
  })

  it('should create a new game with O as first player', async () => {
    const game = { id: generateId({ mode: 'random' }) }

    const testEvent: GameStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameStarted',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: {
        firstPlayer: 'O',
      },
    }

    await events.commitTransaction({
      events: [testEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.currentTurn).toBe('O')
  })
})
