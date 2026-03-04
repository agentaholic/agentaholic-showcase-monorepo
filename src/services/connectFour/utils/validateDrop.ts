import type { GameAggregate } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'
import { findLowestEmptyRow } from '~src/services/connectFour/utils/findLowestEmptyRow'

export const validateDrop = (params: {
  aggregate: GameAggregate
  player: 'Red' | 'Yellow'
  column: number
}): { valid: true } | { valid: false; reason: string } => {
  const { aggregate, player, column } = params

  if (aggregate.status !== 'inProgress') {
    return { valid: false, reason: 'Game is not in progress' }
  }

  if (aggregate.currentTurn !== player) {
    return { valid: false, reason: `It is not ${player}'s turn` }
  }

  if (column < 0 || column > 6) {
    return { valid: false, reason: 'Invalid column' }
  }

  if (findLowestEmptyRow(aggregate.board, column) == null) {
    return { valid: false, reason: 'Column is full' }
  }

  return { valid: true }
}
