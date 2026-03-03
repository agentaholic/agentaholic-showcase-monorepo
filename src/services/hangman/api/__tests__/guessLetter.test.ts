import { describe, it, expect, afterEach } from 'vitest'
import { APIError } from 'encore.dev/api'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { RoundStartedEvent } from '~src/services/hangman/aggregates/Round/events/RoundStarted/RoundStartedEvent'
import { guessLetter } from '~src/services/hangman/api/guessLetter'

describe('guessLetter', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  async function createRoundWithWord(word: string) {
    const round = { id: generateId({ mode: 'random' }) }
    const startEvent: RoundStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'RoundStarted',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { word },
    }
    await events.commitTransaction({
      events: [startEvent],
      namespace: testNamespace,
    })
    return round
  }

  it('should reveal letters in maskedWord for a correct guess', async () => {
    const round = await createRoundWithWord('apple')

    const result = await guessLetter({
      round,
      letter: 'a',
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.maskedWord[0]).toBe('a')
    expect(result.aggregate.guessedLetters).toContain('a')
    expect(result.aggregate.incorrectGuesses).not.toContain('a')
  })

  it('should add to incorrectGuesses for an incorrect guess', async () => {
    const round = await createRoundWithWord('apple')

    const result = await guessLetter({
      round,
      letter: 'z',
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.incorrectGuesses).toContain('z')
    expect(result.aggregate.guessedLetters).toContain('z')
  })

  it('should throw NotFound for nonexistent round', async () => {
    await expect(
      guessLetter({
        round: { id: generateId({ mode: 'random' }) },
        letter: 'a',
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })

  it('should throw FailedPrecondition for an already-guessed letter', async () => {
    const round = await createRoundWithWord('apple')

    await guessLetter({ round, letter: 'a', namespaceSlug: testNamespace.slug })

    await expect(
      guessLetter({ round, letter: 'a', namespaceSlug: testNamespace.slug }),
    ).rejects.toThrow(APIError)
  })

  it('should throw FailedPrecondition for non-letter input', async () => {
    const round = await createRoundWithWord('apple')

    await expect(
      guessLetter({ round, letter: '1', namespaceSlug: testNamespace.slug }),
    ).rejects.toThrow(APIError)
  })

  it('should detect win when all letters are guessed', async () => {
    const round = await createRoundWithWord('hi')

    await guessLetter({ round, letter: 'h', namespaceSlug: testNamespace.slug })
    const result = await guessLetter({
      round,
      letter: 'i',
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('won')
  })

  it('should detect loss after 6 incorrect guesses', async () => {
    const round = await createRoundWithWord('apple')

    const incorrectLetters = ['z', 'x', 'q', 'j', 'v', 'w']
    let result
    for (const letter of incorrectLetters) {
      result = await guessLetter({
        round,
        letter,
        namespaceSlug: testNamespace.slug,
      })
    }

    expect(result?.aggregate.status).toBe('lost')
  })

  it('should not allow guesses after round is won', async () => {
    const round = await createRoundWithWord('hi')

    await guessLetter({ round, letter: 'h', namespaceSlug: testNamespace.slug })
    await guessLetter({ round, letter: 'i', namespaceSlug: testNamespace.slug })

    await expect(
      guessLetter({ round, letter: 'a', namespaceSlug: testNamespace.slug }),
    ).rejects.toThrow(APIError)
  })

  it('should not allow guesses after round is lost', async () => {
    const round = await createRoundWithWord('apple')

    for (const letter of ['z', 'x', 'q', 'j', 'v', 'w']) {
      await guessLetter({ round, letter, namespaceSlug: testNamespace.slug })
    }

    await expect(
      guessLetter({ round, letter: 'a', namespaceSlug: testNamespace.slug }),
    ).rejects.toThrow(APIError)
  })

  it('should hide word when game is still in progress', async () => {
    const round = await createRoundWithWord('apple')

    const result = await guessLetter({
      round,
      letter: 'a',
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('inProgress')
    expect(result.aggregate.word).toBe('')
  })

  it('should reveal word when game is won', async () => {
    const round = await createRoundWithWord('hi')

    await guessLetter({ round, letter: 'h', namespaceSlug: testNamespace.slug })
    const result = await guessLetter({
      round,
      letter: 'i',
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('won')
    expect(result.aggregate.word).toBe('hi')
  })
})
