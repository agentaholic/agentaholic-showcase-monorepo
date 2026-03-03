import { GameStartedEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameStarted/GameStartedEvent'
import { MoveMadeEvent } from '~src/services/ticTacToe/aggregates/Game/events/MoveMade/MoveMadeEvent'
import { GameWonEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameWon/GameWonEvent'
import { GameDrawnEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameDrawn/GameDrawnEvent'
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports

// prettier-ignore
export type GameEvent =
  | GameStartedEvent 
  | MoveMadeEvent 
  | GameWonEvent 
  | GameDrawnEvent
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new event types
