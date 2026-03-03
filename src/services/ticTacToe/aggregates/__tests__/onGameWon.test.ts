import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { GameStartedEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameStarted/GameStartedEvent'
import type { MoveMadeEvent } from '~src/services/ticTacToe/aggregates/Game/events/MoveMade/MoveMadeEvent'
import type { GameWonEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameWon/GameWonEvent'
import { loadGameAggregate } from '~src/services/ticTacToe/aggregates/Game/loadGameAggregate'

describe('onGameWon', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should set status to won and record the winner', async () => {
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
      aggregate: { name: 'Game', id: game.id, service: { name: 'ticTacToe' } },
      data: { player: 'X', row: 0, column: 0 },
    }

    const move2: MoveMadeEvent = {
      id: generateId({ mode: 'random' }),
      name: 'MoveMade',
      version: 1,
      aggregate: { name: 'Game', id: game.id, service: { name: 'ticTacToe' } },
      data: { player: 'O', row: 1, column: 0 },
    }

    const move3: MoveMadeEvent = {
      id: generateId({ mode: 'random' }),
      name: 'MoveMade',
      version: 1,
      aggregate: { name: 'Game', id: game.id, service: { name: 'ticTacToe' } },
      data: { player: 'X', row: 0, column: 1 },
    }

    const move4: MoveMadeEvent = {
      id: generateId({ mode: 'random' }),
      name: 'MoveMade',
      version: 1,
      aggregate: { name: 'Game', id: game.id, service: { name: 'ticTacToe' } },
      data: { player: 'O', row: 1, column: 1 },
    }

    const move5: MoveMadeEvent = {
      id: generateId({ mode: 'random' }),
      name: 'MoveMade',
      version: 1,
      aggregate: { name: 'Game', id: game.id, service: { name: 'ticTacToe' } },
      data: { player: 'X', row: 0, column: 2 },
    }

    const wonEvent: GameWonEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameWon',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: { winner: 'X' },
    }

    await events.commitTransaction({
      events: [startEvent, move1, move2, move3, move4, move5, wonEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.status).toBe('won')
    expect(aggregate?.winner).toBe('X')
  })
})
