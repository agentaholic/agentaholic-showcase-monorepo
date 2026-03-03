export type RoundAggregate = {
  id: string
  word: string
  maskedWord: Array<string | null>
  guessedLetters: Array<string>
  incorrectGuesses: Array<string>
  maxIncorrectGuesses: number
  status: 'inProgress' | 'won' | 'lost'
}
