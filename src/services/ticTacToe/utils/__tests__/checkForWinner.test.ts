import { describe, it, expect } from 'vitest'
import { checkForWinner } from '~src/services/ticTacToe/utils/checkForWinner'
import type { Board } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'

const emptyBoard: Board = [
  [null, null, null],
  [null, null, null],
  [null, null, null],
]

describe('checkForWinner', () => {
  it('should return null for an empty board', () => {
    expect(checkForWinner(emptyBoard)).toBeNull()
  })

  it('should detect X winning in top row', () => {
    const board: Board = [
      ['X', 'X', 'X'],
      ['O', 'O', null],
      [null, null, null],
    ]
    expect(checkForWinner(board)).toBe('X')
  })

  it('should detect O winning in middle row', () => {
    const board: Board = [
      ['X', null, 'X'],
      ['O', 'O', 'O'],
      ['X', null, null],
    ]
    expect(checkForWinner(board)).toBe('O')
  })

  it('should detect X winning in bottom row', () => {
    const board: Board = [
      ['O', 'O', null],
      [null, null, null],
      ['X', 'X', 'X'],
    ]
    expect(checkForWinner(board)).toBe('X')
  })

  it('should detect X winning in left column', () => {
    const board: Board = [
      ['X', 'O', null],
      ['X', 'O', null],
      ['X', null, null],
    ]
    expect(checkForWinner(board)).toBe('X')
  })

  it('should detect O winning in center column', () => {
    const board: Board = [
      ['X', 'O', null],
      [null, 'O', 'X'],
      ['X', 'O', null],
    ]
    expect(checkForWinner(board)).toBe('O')
  })

  it('should detect X winning in right column', () => {
    const board: Board = [
      [null, 'O', 'X'],
      [null, 'O', 'X'],
      [null, null, 'X'],
    ]
    expect(checkForWinner(board)).toBe('X')
  })

  it('should detect X winning on main diagonal', () => {
    const board: Board = [
      ['X', 'O', null],
      ['O', 'X', null],
      [null, null, 'X'],
    ]
    expect(checkForWinner(board)).toBe('X')
  })

  it('should detect O winning on anti-diagonal', () => {
    const board: Board = [
      ['X', null, 'O'],
      ['X', 'O', null],
      ['O', null, 'X'],
    ]
    expect(checkForWinner(board)).toBe('O')
  })

  it('should return null for a board with no winner', () => {
    const board: Board = [
      ['X', 'O', 'X'],
      ['X', 'O', 'O'],
      ['O', 'X', null],
    ]
    expect(checkForWinner(board)).toBeNull()
  })
})
