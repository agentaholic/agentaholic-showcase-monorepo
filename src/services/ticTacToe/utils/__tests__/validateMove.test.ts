import { describe, it, expect } from 'vitest'
import { validateMove } from '~src/services/ticTacToe/utils/validateMove'
import type { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'

const makeAggregate = (overrides?: Partial<GameAggregate>): GameAggregate => ({
  id: 'test-id',
  board: [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ],
  currentTurn: 'X',
  status: 'inProgress',
  winner: null,
  moves: [],
  ...overrides,
})

describe('validateMove', () => {
  it('should return valid for a correct move', () => {
    const result = validateMove({
      aggregate: makeAggregate(),
      player: 'X',
      row: 0,
      column: 0,
    })
    expect(result).toEqual({ valid: true })
  })

  it('should reject a move when game is not in progress (won)', () => {
    const result = validateMove({
      aggregate: makeAggregate({ status: 'won' }),
      player: 'X',
      row: 0,
      column: 0,
    })
    expect(result).toEqual({ valid: false, reason: 'Game is not in progress' })
  })

  it('should reject a move when game is not in progress (drawn)', () => {
    const result = validateMove({
      aggregate: makeAggregate({ status: 'drawn' }),
      player: 'X',
      row: 0,
      column: 0,
    })
    expect(result).toEqual({ valid: false, reason: 'Game is not in progress' })
  })

  it('should reject a move when it is not the player turn', () => {
    const result = validateMove({
      aggregate: makeAggregate({ currentTurn: 'O' }),
      player: 'X',
      row: 0,
      column: 0,
    })
    expect(result).toEqual({ valid: false, reason: "It is not X's turn" })
  })

  it('should reject a move with invalid row (negative)', () => {
    const result = validateMove({
      aggregate: makeAggregate(),
      player: 'X',
      row: -1,
      column: 0,
    })
    expect(result).toEqual({ valid: false, reason: 'Invalid coordinates' })
  })

  it('should reject a move with invalid row (too large)', () => {
    const result = validateMove({
      aggregate: makeAggregate(),
      player: 'X',
      row: 3,
      column: 0,
    })
    expect(result).toEqual({ valid: false, reason: 'Invalid coordinates' })
  })

  it('should reject a move with invalid column (negative)', () => {
    const result = validateMove({
      aggregate: makeAggregate(),
      player: 'X',
      row: 0,
      column: -1,
    })
    expect(result).toEqual({ valid: false, reason: 'Invalid coordinates' })
  })

  it('should reject a move with invalid column (too large)', () => {
    const result = validateMove({
      aggregate: makeAggregate(),
      player: 'X',
      row: 0,
      column: 3,
    })
    expect(result).toEqual({ valid: false, reason: 'Invalid coordinates' })
  })

  it('should reject a move on an occupied cell', () => {
    const board: GameAggregate['board'] = [
      ['X', null, null],
      [null, null, null],
      [null, null, null],
    ]
    const result = validateMove({
      aggregate: makeAggregate({ board, currentTurn: 'O' }),
      player: 'O',
      row: 0,
      column: 0,
    })
    expect(result).toEqual({ valid: false, reason: 'Cell is already occupied' })
  })
})
