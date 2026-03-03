import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { RoundStartedEvent } from '~src/services/hangman/aggregates/Round/events/RoundStarted/RoundStartedEvent'
import type { RoundLostEvent } from '~src/services/hangman/aggregates/Round/events/RoundLost/RoundLostEvent'
import { loadRoundAggregate } from '~src/services/hangman/aggregates/Round/loadRoundAggregate'

describe('onRoundLost', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should set status to lost', async () => {
    const round = { id: generateId({ mode: 'random' }) }

    const startEvent: RoundStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'RoundStarted',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { word: 'apple' },
    }

    const lostEvent: RoundLostEvent = {
      id: generateId({ mode: 'random' }),
      name: 'RoundLost',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: {},
    }

    await events.commitTransaction({
      events: [startEvent],
      namespace: testNamespace,
    })
    await events.commitTransaction({
      events: [lostEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadRoundAggregate({
      id: round.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.status).toBe('lost')
  })
})
