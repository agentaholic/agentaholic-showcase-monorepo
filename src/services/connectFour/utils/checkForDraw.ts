import type { Board } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'

export const checkForDraw = (board: Board): boolean => {
  for (const row of board) {
    for (const cell of row) {
      if (cell == null) {
        return false
      }
    }
  }
  return true
}
