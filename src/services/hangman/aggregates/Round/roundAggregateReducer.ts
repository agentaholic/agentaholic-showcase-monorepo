import { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'
import { RoundEvent } from '~src/services/hangman/aggregates/Round/RoundEvent'
import { onRoundStarted } from '~src/services/hangman/aggregates/Round/events/RoundStarted/onRoundStarted'
import { onLetterGuessed } from '~src/services/hangman/aggregates/Round/events/LetterGuessed/onLetterGuessed'
import { onRoundWon } from '~src/services/hangman/aggregates/Round/events/RoundWon/onRoundWon'
import { onRoundLost } from '~src/services/hangman/aggregates/Round/events/RoundLost/onRoundLost'
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports

export const roundAggregateReducer = (
  aggregate: RoundAggregate | null,
  event: RoundEvent,
): RoundAggregate | null => {
  switch (event.name) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case 'RoundStarted':
      return onRoundStarted(aggregate, event)

    case 'LetterGuessed':
      return onLetterGuessed(aggregate, event)

    case 'RoundWon':
      return onRoundWon(aggregate, event)

    case 'RoundLost':
      return onRoundLost(aggregate, event)

    // DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new event handlers
  }
}
