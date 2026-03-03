import { describe, it, expect } from 'vitest'
import { pickRandomWord } from '~src/services/hangman/utils/pickRandomWord'

describe('pickRandomWord', () => {
  it('returns a string', () => {
    const result = pickRandomWord()
    expect(typeof result).toBe('string')
  })

  it('returns a non-empty lowercase string', () => {
    const result = pickRandomWord()
    expect(result.length).toBeGreaterThan(0)
    expect(result).toBe(result.toLowerCase())
  })
})
