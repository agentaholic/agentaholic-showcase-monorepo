export type CellValue = 'Red' | 'Yellow' | null

export type Board = Array<Array<CellValue>>

export type GameAggregate = {
  id: string
  board: Board
  currentTurn: 'Red' | 'Yellow'
  status: 'inProgress' | 'won' | 'drawn'
  winner: 'Red' | 'Yellow' | null
  moves: Array<{ player: 'Red' | 'Yellow'; row: number; column: number }>
}
