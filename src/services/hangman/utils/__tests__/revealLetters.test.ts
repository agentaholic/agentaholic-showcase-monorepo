import { describe, it, expect } from 'vitest'
import { revealLetters } from '~src/services/hangman/utils/revealLetters'

describe('revealLetters', () => {
  it('reveals all matching positions for a correct letter', () => {
    const result = revealLetters({
      word: 'apple',
      letter: 'e',
      maskedWord: [null, null, null, null, null],
    })
    expect(result).toEqual([null, null, null, null, 'e'])
  })

  it('returns unchanged maskedWord for incorrect letter', () => {
    const result = revealLetters({
      word: 'apple',
      letter: 'z',
      maskedWord: [null, null, null, null, null],
    })
    expect(result).toEqual([null, null, null, null, null])
  })

  it('handles duplicate letters in word', () => {
    const result = revealLetters({
      word: 'apple',
      letter: 'p',
      maskedWord: [null, null, null, null, null],
    })
    expect(result).toEqual([null, 'p', 'p', null, null])
  })

  it('preserves already-revealed letters', () => {
    const result = revealLetters({
      word: 'apple',
      letter: 'e',
      maskedWord: ['a', null, null, null, null],
    })
    expect(result).toEqual(['a', null, null, null, 'e'])
  })
})
