import type { Board } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'

export const findLowestEmptyRow = (
  board: Board,
  column: number,
): number | null => {
  for (let row = 5; row >= 0; row--) {
    if (board[row][column] == null) {
      return row
    }
  }
  return null
}
