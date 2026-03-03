export type GameWonEvent = {
  name: 'GameWon'
  version: 1
  id: string
  aggregate: {
    name: 'Game'
    id: string
    service: { name: 'ticTacToe' }
  }
  data: {
    winner: 'X' | 'O'
  }
}
