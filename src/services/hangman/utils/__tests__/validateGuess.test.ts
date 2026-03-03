import { describe, it, expect } from 'vitest'
import { validateGuess } from '~src/services/hangman/utils/validateGuess'
import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'

const makeAggregate = (
  overrides?: Partial<RoundAggregate>,
): RoundAggregate => ({
  id: 'test-id',
  word: 'apple',
  maskedWord: [null, null, null, null, null],
  guessedLetters: [],
  incorrectGuesses: [],
  maxIncorrectGuesses: 6,
  status: 'inProgress',
  ...overrides,
})

describe('validateGuess', () => {
  it('returns valid: true for a valid guess', () => {
    const result = validateGuess({ aggregate: makeAggregate(), letter: 'a' })
    expect(result).toEqual({ valid: true })
  })

  it('rejects when round status is won', () => {
    const result = validateGuess({
      aggregate: makeAggregate({ status: 'won' }),
      letter: 'a',
    })
    expect(result).toEqual({ valid: false, reason: 'Round is not in progress' })
  })

  it('rejects when round status is lost', () => {
    const result = validateGuess({
      aggregate: makeAggregate({ status: 'lost' }),
      letter: 'a',
    })
    expect(result).toEqual({ valid: false, reason: 'Round is not in progress' })
  })

  it('rejects non-letter characters (digits)', () => {
    const result = validateGuess({ aggregate: makeAggregate(), letter: '5' })
    expect(result).toEqual({
      valid: false,
      reason: 'Guess must be a single letter (a-z)',
    })
  })

  it('rejects non-letter characters (special chars)', () => {
    const result = validateGuess({ aggregate: makeAggregate(), letter: '!' })
    expect(result).toEqual({
      valid: false,
      reason: 'Guess must be a single letter (a-z)',
    })
  })

  it('rejects multi-character strings', () => {
    const result = validateGuess({ aggregate: makeAggregate(), letter: 'ab' })
    expect(result).toEqual({
      valid: false,
      reason: 'Guess must be a single letter (a-z)',
    })
  })

  it('rejects empty string', () => {
    const result = validateGuess({ aggregate: makeAggregate(), letter: '' })
    expect(result).toEqual({
      valid: false,
      reason: 'Guess must be a single letter (a-z)',
    })
  })

  it('rejects already-guessed letter', () => {
    const result = validateGuess({
      aggregate: makeAggregate({ guessedLetters: ['a'] }),
      letter: 'a',
    })
    expect(result).toEqual({
      valid: false,
      reason: 'Letter has already been guessed',
    })
  })
})
