export type GameDrawnEvent = {
  name: 'GameDrawn'
  version: 1
  id: string
  aggregate: {
    name: 'Game'
    id: string
    service: { name: 'ticTacToe' }
  }
  data: Record<string, never>
}
