import { describe, it, expect } from 'vitest'
import { checkForWin } from '~src/services/hangman/utils/checkForWin'

describe('checkForWin', () => {
  it('returns false when maskedWord has nulls', () => {
    expect(checkForWin([null, 'p', null, 'l', 'e'])).toBe(false)
  })

  it('returns true when all positions are filled', () => {
    expect(checkForWin(['a', 'p', 'p', 'l', 'e'])).toBe(true)
  })

  it('returns true for empty array (edge case)', () => {
    expect(checkForWin([])).toBe(true)
  })
})
