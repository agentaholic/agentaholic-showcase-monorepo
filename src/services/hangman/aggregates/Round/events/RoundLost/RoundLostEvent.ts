export type RoundLostEvent = {
  name: 'RoundLost'
  version: 1
  id: string
  aggregate: {
    name: 'Round'
    id: string
    service: { name: 'hangman' }
  }
  data: Record<string, never>
}
