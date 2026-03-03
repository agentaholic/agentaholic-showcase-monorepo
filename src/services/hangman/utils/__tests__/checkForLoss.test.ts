import { describe, it, expect } from 'vitest'
import { checkForLoss } from '~src/services/hangman/utils/checkForLoss'

describe('checkForLoss', () => {
  it('returns false when incorrectGuesses < maxIncorrectGuesses', () => {
    expect(
      checkForLoss({ incorrectGuesses: ['x', 'y'], maxIncorrectGuesses: 6 }),
    ).toBe(false)
  })

  it('returns true when incorrectGuesses > maxIncorrectGuesses', () => {
    expect(
      checkForLoss({
        incorrectGuesses: ['x', 'y', 'z', 'q', 'w', 'r', 's'],
        maxIncorrectGuesses: 6,
      }),
    ).toBe(true)
  })

  it('returns true when exactly at max', () => {
    expect(
      checkForLoss({
        incorrectGuesses: ['x', 'y', 'z', 'q', 'w', 'r'],
        maxIncorrectGuesses: 6,
      }),
    ).toBe(true)
  })
})
