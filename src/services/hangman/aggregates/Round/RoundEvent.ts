import { RoundStartedEvent } from '~src/services/hangman/aggregates/Round/events/RoundStarted/RoundStartedEvent'
import { LetterGuessedEvent } from '~src/services/hangman/aggregates/Round/events/LetterGuessed/LetterGuessedEvent'
import { RoundWonEvent } from '~src/services/hangman/aggregates/Round/events/RoundWon/RoundWonEvent'
import { RoundLostEvent } from '~src/services/hangman/aggregates/Round/events/RoundLost/RoundLostEvent'
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports

// prettier-ignore
export type RoundEvent =
  | RoundStartedEvent 
  | LetterGuessedEvent 
  | RoundWonEvent 
  | RoundLostEvent
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new event types
