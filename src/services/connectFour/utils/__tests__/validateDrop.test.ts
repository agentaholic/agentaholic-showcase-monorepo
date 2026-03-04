import { describe, it, expect } from 'vitest'
import { validateDrop } from '~src/services/connectFour/utils/validateDrop'
import type {
  GameAggregate,
  Board,
} from '~src/services/connectFour/aggregates/Game/types/GameAggregate'

const emptyBoard = (): Board =>
  Array.from({ length: 6 }, () => Array.from({ length: 7 }, () => null))

const makeAggregate = (
  overrides: Partial<GameAggregate> = {},
): GameAggregate => ({
  id: 'test-id',
  board: emptyBoard(),
  currentTurn: 'Red',
  status: 'inProgress',
  winner: null,
  moves: [],
  ...overrides,
})

describe('validateDrop', () => {
  it('should return invalid when game is not in progress', () => {
    const aggregate = makeAggregate({ status: 'won', winner: 'Red' })
    const result = validateDrop({ aggregate, player: 'Red', column: 0 })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.reason).toBe('Game is not in progress')
  })

  it("should return invalid when it is not the player's turn", () => {
    const aggregate = makeAggregate({ currentTurn: 'Yellow' })
    const result = validateDrop({ aggregate, player: 'Red', column: 0 })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.reason).toContain('Red')
  })

  it('should return invalid for column less than 0', () => {
    const aggregate = makeAggregate()
    const result = validateDrop({ aggregate, player: 'Red', column: -1 })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.reason).toBe('Invalid column')
  })

  it('should return invalid for column greater than 6', () => {
    const aggregate = makeAggregate()
    const result = validateDrop({ aggregate, player: 'Red', column: 7 })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.reason).toBe('Invalid column')
  })

  it('should return invalid when column is full', () => {
    const board = emptyBoard()
    for (let row = 0; row < 6; row++) {
      board[row][0] = 'Red'
    }
    const aggregate = makeAggregate({ board })
    const result = validateDrop({ aggregate, player: 'Red', column: 0 })
    expect(result.valid).toBe(false)
    if (!result.valid) expect(result.reason).toBe('Column is full')
  })

  it('should return valid for a valid drop', () => {
    const aggregate = makeAggregate()
    const result = validateDrop({ aggregate, player: 'Red', column: 3 })
    expect(result.valid).toBe(true)
  })
})
