export type GameStartedEvent = {
  name: 'GameStarted'
  version: 1
  id: string
  aggregate: {
    name: 'Game'
    id: string
    service: { name: 'ticTacToe' }
  }
  data: {
    firstPlayer: 'X' | 'O'
  }
}
