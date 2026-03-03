import { describe, it, expect } from 'vitest'
import { checkForDraw } from '~src/services/ticTacToe/utils/checkForDraw'
import type { Board } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'

describe('checkForDraw', () => {
  it('should return false for an empty board', () => {
    const board: Board = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]
    expect(checkForDraw(board)).toBe(false)
  })

  it('should return false when there are empty cells', () => {
    const board: Board = [
      ['X', 'O', 'X'],
      ['X', 'O', 'O'],
      ['O', 'X', null],
    ]
    expect(checkForDraw(board)).toBe(false)
  })

  it('should return true when all cells are filled', () => {
    const board: Board = [
      ['X', 'O', 'X'],
      ['X', 'O', 'O'],
      ['O', 'X', 'X'],
    ]
    expect(checkForDraw(board)).toBe(true)
  })
})
