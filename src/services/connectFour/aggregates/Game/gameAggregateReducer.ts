import type { GameAggregate } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'
import type { GameEvent } from '~src/services/connectFour/aggregates/Game/GameEvent'
import { onGameStarted } from '~src/services/connectFour/aggregates/Game/events/GameStarted/onGameStarted'
import { onGameDiscDropped } from '~src/services/connectFour/aggregates/Game/events/GameDiscDropped/onGameDiscDropped'
import { onGameWon } from '~src/services/connectFour/aggregates/Game/events/GameWon/onGameWon'
import { onGameDrawn } from '~src/services/connectFour/aggregates/Game/events/GameDrawn/onGameDrawn'

export const gameAggregateReducer = (
  aggregate: GameAggregate | null,
  event: GameEvent,
): GameAggregate | null => {
  switch (event.name) {
    case 'GameStarted':
      return onGameStarted(aggregate, event)
    case 'GameDiscDropped':
      return onGameDiscDropped(aggregate, event)
    case 'GameWon':
      return onGameWon(aggregate, event)
    case 'GameDrawn':
      return onGameDrawn(aggregate, event)
  }
}
