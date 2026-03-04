import type { GameStartedEvent } from '~src/services/connectFour/aggregates/Game/events/GameStarted/GameStartedEvent'
import type { GameDiscDroppedEvent } from '~src/services/connectFour/aggregates/Game/events/GameDiscDropped/GameDiscDroppedEvent'
import type { GameWonEvent } from '~src/services/connectFour/aggregates/Game/events/GameWon/GameWonEvent'
import type { GameDrawnEvent } from '~src/services/connectFour/aggregates/Game/events/GameDrawn/GameDrawnEvent'

// prettier-ignore
export type GameEvent =
  | GameStartedEvent
  | GameDiscDroppedEvent
  | GameWonEvent
  | GameDrawnEvent
