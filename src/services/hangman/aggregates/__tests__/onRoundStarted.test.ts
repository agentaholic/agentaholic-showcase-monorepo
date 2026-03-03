import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { RoundStartedEvent } from '~src/services/hangman/aggregates/Round/events/RoundStarted/RoundStartedEvent'
import { loadRoundAggregate } from '~src/services/hangman/aggregates/Round/loadRoundAggregate'

describe('onRoundStarted', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should create a new round with masked word', async () => {
    const round = { id: generateId({ mode: 'random' }) }

    const testEvent: RoundStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'RoundStarted',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { word: 'apple' },
    }

    await events.commitTransaction({
      events: [testEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadRoundAggregate({
      id: round.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.id).toBe(round.id)
    expect(aggregate?.word).toBe('apple')
    expect(aggregate?.maskedWord).toEqual([null, null, null, null, null])
    expect(aggregate?.guessedLetters).toEqual([])
    expect(aggregate?.incorrectGuesses).toEqual([])
    expect(aggregate?.maxIncorrectGuesses).toBe(6)
    expect(aggregate?.status).toBe('inProgress')
  })
})
