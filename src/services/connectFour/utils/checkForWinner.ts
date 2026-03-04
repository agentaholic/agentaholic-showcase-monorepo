import type {
  Board,
  CellValue,
} from '~src/services/connectFour/aggregates/Game/types/GameAggregate'

const directions: Array<[number, number]> = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
]

export const checkForWinner = (board: Board): 'Red' | 'Yellow' | null => {
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      const cell = board[row][col]
      if (cell == null) continue

      for (const [deltaRow, deltaCol] of directions) {
        if (checkDirection(board, cell, row, col, deltaRow, deltaCol)) {
          return cell
        }
      }
    }
  }
  return null
}

const checkDirection = (
  board: Board,
  player: CellValue,
  row: number,
  col: number,
  deltaRow: number,
  deltaCol: number,
): boolean => {
  for (let i = 1; i < 4; i++) {
    const newRow = row + deltaRow * i
    const newCol = col + deltaCol * i
    if (
      newRow < 0 ||
      newRow >= 6 ||
      newCol < 0 ||
      newCol >= 7 ||
      board[newRow][newCol] !== player
    ) {
      return false
    }
  }
  return true
}
