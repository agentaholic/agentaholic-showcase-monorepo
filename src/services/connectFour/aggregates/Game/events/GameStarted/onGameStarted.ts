import type { GameAggregate } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'
import type { GameStartedEvent } from '~src/services/connectFour/aggregates/Game/events/GameStarted/GameStartedEvent'

export const onGameStarted = (
  _aggregate: GameAggregate | null,
  event: GameStartedEvent,
): GameAggregate | null => {
  return {
    id: event.aggregate.id,
    board: Array.from({ length: 6 }, () =>
      Array.from({ length: 7 }, () => null),
    ),
    currentTurn: event.data.firstPlayer,
    status: 'inProgress',
    winner: null,
    moves: [],
  }
}
