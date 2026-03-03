import type { Board } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'

const lines: Array<Array<[number, number]>> = [
  // rows
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  // columns
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  // diagonals
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
]

export const checkForWinner = (board: Board): 'X' | 'O' | null => {
  for (const line of lines) {
    const [a, b, c] = line
    const cellA = board[a[0]][a[1]]
    const cellB = board[b[0]][b[1]]
    const cellC = board[c[0]][c[1]]

    if (cellA != null && cellA === cellB && cellA === cellC) {
      return cellA
    }
  }

  return null
}
