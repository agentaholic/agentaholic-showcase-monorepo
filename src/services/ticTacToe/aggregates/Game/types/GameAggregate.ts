export type CellValue = 'X' | 'O' | null

export type Board = Array<Array<CellValue>>

export type GameAggregate = {
  id: string
  board: Board
  currentTurn: 'X' | 'O'
  status: 'inProgress' | 'won' | 'drawn'
  winner: 'X' | 'O' | null
  moves: Array<{ player: 'X' | 'O'; row: number; column: number }>
}
