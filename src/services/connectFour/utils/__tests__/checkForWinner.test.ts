import { describe, it, expect } from 'vitest'
import { checkForWinner } from '~src/services/connectFour/utils/checkForWinner'
import type { Board } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'

const emptyBoard = (): Board =>
  Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null))

describe('checkForWinner', () => {
  it('should return null when no winner', () => {
    expect(checkForWinner(emptyBoard())).toBeNull()
  })

  it('should detect horizontal win', () => {
    const board = emptyBoard()
    board[5][0] = 'Red'
    board[5][1] = 'Red'
    board[5][2] = 'Red'
    board[5][3] = 'Red'
    expect(checkForWinner(board)).toBe('Red')
  })

  it('should detect vertical win', () => {
    const board = emptyBoard()
    board[2][0] = 'Yellow'
    board[3][0] = 'Yellow'
    board[4][0] = 'Yellow'
    board[5][0] = 'Yellow'
    expect(checkForWinner(board)).toBe('Yellow')
  })

  it('should detect diagonal down-right win', () => {
    const board = emptyBoard()
    board[2][0] = 'Red'
    board[3][1] = 'Red'
    board[4][2] = 'Red'
    board[5][3] = 'Red'
    expect(checkForWinner(board)).toBe('Red')
  })

  it('should detect diagonal down-left win', () => {
    const board = emptyBoard()
    board[2][6] = 'Yellow'
    board[3][5] = 'Yellow'
    board[4][4] = 'Yellow'
    board[5][3] = 'Yellow'
    expect(checkForWinner(board)).toBe('Yellow')
  })

  it('should not return a winner with only 3 in a row', () => {
    const board = emptyBoard()
    board[5][0] = 'Red'
    board[5][1] = 'Red'
    board[5][2] = 'Red'
    expect(checkForWinner(board)).toBeNull()
  })
})
