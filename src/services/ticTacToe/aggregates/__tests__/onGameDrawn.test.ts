import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { GameStartedEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameStarted/GameStartedEvent'
import type { GameDrawnEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameDrawn/GameDrawnEvent'
import { loadGameAggregate } from '~src/services/ticTacToe/aggregates/Game/loadGameAggregate'

describe('onGameDrawn', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should set status to drawn', async () => {
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

    const drawnEvent: GameDrawnEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameDrawn',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: {},
    }

    await events.commitTransaction({
      events: [startEvent, drawnEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.status).toBe('drawn')
  })
})
