import { describe, it, expect } from 'vitest'
import { checkForDraw } from '~src/services/connectFour/utils/checkForDraw'
import type { Board } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'

const emptyBoard = (): Board =>
  Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null))

const fullBoard = (): Board => {
  const board: Board = []
  for (let row = 0; row < 6; row++) {
    board.push([])
    for (let col = 0; col < 7; col++) {
      board[row].push(row % 2 === 0 ? 'Red' : 'Yellow')
    }
  }
  return board
}

describe('checkForDraw', () => {
  it('should return true for a full board', () => {
    expect(checkForDraw(fullBoard())).toBe(true)
  })

  it('should return false for an empty board', () => {
    expect(checkForDraw(emptyBoard())).toBe(false)
  })

  it('should return false for a board with one empty cell', () => {
    const board = fullBoard()
    board[0][0] = null
    expect(checkForDraw(board)).toBe(false)
  })
})
