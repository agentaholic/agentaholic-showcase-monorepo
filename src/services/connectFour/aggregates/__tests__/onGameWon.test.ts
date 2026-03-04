import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { GameStartedEvent } from '~src/services/connectFour/aggregates/Game/events/GameStarted/GameStartedEvent'
import type { GameWonEvent } from '~src/services/connectFour/aggregates/Game/events/GameWon/GameWonEvent'
import { loadGameAggregate } from '~src/services/connectFour/aggregates/Game/loadGameAggregate'

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
        service: { name: 'connectFour' },
      },
      data: { firstPlayer: 'Red' },
    }

    const wonEvent: GameWonEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameWon',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'connectFour' },
      },
      data: { winner: 'Red' },
    }

    await events.commitTransaction({
      events: [startEvent, wonEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.status).toBe('won')
    expect(aggregate?.winner).toBe('Red')
  })

  it('should record Yellow as winner', async () => {
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

    const wonEvent: GameWonEvent = {
      id: generateId({ mode: 'random' }),
      name: 'GameWon',
      version: 1,
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'connectFour' },
      },
      data: { winner: 'Yellow' },
    }

    await events.commitTransaction({
      events: [startEvent, wonEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadGameAggregate({
      id: game.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.status).toBe('won')
    expect(aggregate?.winner).toBe('Yellow')
  })
})
