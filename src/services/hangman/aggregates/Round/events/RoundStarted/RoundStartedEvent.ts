export type RoundStartedEvent = {
  name: 'RoundStarted'
  version: 1
  id: string
  aggregate: {
    name: 'Round'
    id: string
    service: { name: 'hangman' }
  }
  data: { word: string }
}
