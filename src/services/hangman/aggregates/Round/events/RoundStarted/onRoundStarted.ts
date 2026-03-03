import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'
import type { RoundStartedEvent } from '~src/services/hangman/aggregates/Round/events/RoundStarted/RoundStartedEvent'

export const onRoundStarted = (
  _aggregate: RoundAggregate | null,
  event: RoundStartedEvent,
): RoundAggregate | null => {
  const { word } = event.data
  return {
    id: event.aggregate.id,
    word,
    maskedWord: word.split('').map(() => null),
    guessedLetters: [],
    incorrectGuesses: [],
    maxIncorrectGuesses: 6,
    status: 'inProgress',
  }
}
