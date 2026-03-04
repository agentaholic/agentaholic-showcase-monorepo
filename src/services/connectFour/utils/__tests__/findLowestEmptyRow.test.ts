import { describe, it, expect } from 'vitest'
import { findLowestEmptyRow } from '~src/services/connectFour/utils/findLowestEmptyRow'
import type { Board } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'

const emptyBoard = (): Board =>
  Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null))

describe('findLowestEmptyRow', () => {
  it('should return 5 for an empty column', () => {
    const board = emptyBoard()
    expect(findLowestEmptyRow(board, 3)).toBe(5)
  })

  it('should return correct row for partially filled column', () => {
    const board = emptyBoard()
    board[5][0] = 'Red'
    board[4][0] = 'Yellow'
    expect(findLowestEmptyRow(board, 0)).toBe(3)
  })

  it('should return null for a full column', () => {
    const board = emptyBoard()
    for (let row = 0; row < 6; row++) {
      board[row][2] = 'Red'
    }
    expect(findLowestEmptyRow(board, 2)).toBeNull()
  })
})
