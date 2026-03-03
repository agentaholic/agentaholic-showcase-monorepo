export type LetterGuessedEvent = {
  name: 'LetterGuessed'
  version: 1
  id: string
  aggregate: {
    name: 'Round'
    id: string
    service: { name: 'hangman' }
  }
  data: { letter: string }
}
