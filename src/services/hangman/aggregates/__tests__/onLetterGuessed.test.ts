import { describe, it, expect, afterEach } from 'vitest'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { RoundStartedEvent } from '~src/services/hangman/aggregates/Round/events/RoundStarted/RoundStartedEvent'
import type { LetterGuessedEvent } from '~src/services/hangman/aggregates/Round/events/LetterGuessed/LetterGuessedEvent'
import { loadRoundAggregate } from '~src/services/hangman/aggregates/Round/loadRoundAggregate'

describe('onLetterGuessed', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should reveal correct letter positions in masked word', async () => {
    const round = { id: generateId({ mode: 'random' }) }

    const startEvent: RoundStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'RoundStarted',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { word: 'apple' },
    }

    const guessEvent: LetterGuessedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'LetterGuessed',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { letter: 'p' },
    }

    await events.commitTransaction({
      events: [startEvent],
      namespace: testNamespace,
    })
    await events.commitTransaction({
      events: [guessEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadRoundAggregate({
      id: round.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.maskedWord).toEqual([null, 'p', 'p', null, null])
    expect(aggregate?.guessedLetters).toEqual(['p'])
    expect(aggregate?.incorrectGuesses).toEqual([])
  })

  it('should add incorrect guess to incorrectGuesses', async () => {
    const round = { id: generateId({ mode: 'random' }) }

    const startEvent: RoundStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'RoundStarted',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { word: 'apple' },
    }

    const guessEvent: LetterGuessedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'LetterGuessed',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { letter: 'z' },
    }

    await events.commitTransaction({
      events: [startEvent],
      namespace: testNamespace,
    })
    await events.commitTransaction({
      events: [guessEvent],
      namespace: testNamespace,
    })

    const aggregate = await loadRoundAggregate({
      id: round.id,
      namespace: testNamespace,
    })

    expect(aggregate).not.toBeNull()
    expect(aggregate?.maskedWord).toEqual([null, null, null, null, null])
    expect(aggregate?.guessedLetters).toEqual(['z'])
    expect(aggregate?.incorrectGuesses).toEqual(['z'])
  })
})
