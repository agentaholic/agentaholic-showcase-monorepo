import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'
import type { LetterGuessedEvent } from '~src/services/hangman/aggregates/Round/events/LetterGuessed/LetterGuessedEvent'

export const onLetterGuessed = (
  aggregate: RoundAggregate | null,
  event: LetterGuessedEvent,
): RoundAggregate | null => {
  /* v8 ignore next 3 */
  if (aggregate == null) {
    return null
  }

  const { letter } = event.data
  const lowerLetter = letter.toLowerCase()
  const wordLetters = aggregate.word.toLowerCase().split('')

  const isCorrect = wordLetters.includes(lowerLetter)

  const maskedWord = isCorrect
    ? aggregate.maskedWord.map((current, index) =>
        wordLetters[index] === lowerLetter ? aggregate.word[index] : current,
      )
    : [...aggregate.maskedWord]

  const incorrectGuesses = isCorrect
    ? [...aggregate.incorrectGuesses]
    : [...aggregate.incorrectGuesses, lowerLetter]

  return {
    ...aggregate,
    maskedWord,
    guessedLetters: [...aggregate.guessedLetters, lowerLetter],
    incorrectGuesses,
  }
}
