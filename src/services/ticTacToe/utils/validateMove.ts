import type { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'

export const validateMove = (params: {
  aggregate: GameAggregate
  player: 'X' | 'O'
  row: number
  column: number
}): { valid: true } | { valid: false; reason: string } => {
  const { aggregate, player, row, column } = params

  if (aggregate.status !== 'inProgress') {
    return { valid: false, reason: 'Game is not in progress' }
  }

  if (aggregate.currentTurn !== player) {
    return { valid: false, reason: `It is not ${player}'s turn` }
  }

  if (row < 0 || row > 2 || column < 0 || column > 2) {
    return { valid: false, reason: 'Invalid coordinates' }
  }

  if (aggregate.board[row][column] != null) {
    return { valid: false, reason: 'Cell is already occupied' }
  }

  return { valid: true }
}
