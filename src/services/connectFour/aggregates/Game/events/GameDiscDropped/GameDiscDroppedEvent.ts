export type GameDiscDroppedEvent = {
  name: 'GameDiscDropped'
  version: 1
  id: string
  aggregate: {
    name: 'Game'
    id: string
    service: { name: 'connectFour' }
  }
  data: {
    player: 'Red' | 'Yellow'
    column: number
    row: number
  }
}
