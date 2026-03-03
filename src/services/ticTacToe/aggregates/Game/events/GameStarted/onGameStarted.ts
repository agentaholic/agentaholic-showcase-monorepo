import type { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'
import type { GameStartedEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameStarted/GameStartedEvent'

export const onGameStarted = (
  _aggregate: GameAggregate | null,
  event: GameStartedEvent,
): GameAggregate | null => {
  return {
    id: event.aggregate.id,
    board: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    currentTurn: event.data.firstPlayer,
    status: 'inProgress',
    winner: null,
    moves: [],
  }
}
