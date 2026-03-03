export type MoveMadeEvent = {
  name: 'MoveMade'
  version: 1
  id: string
  aggregate: {
    name: 'Game'
    id: string
    service: { name: 'ticTacToe' }
  }
  data: {
    player: 'X' | 'O'
    row: number
    column: number
  }
}
