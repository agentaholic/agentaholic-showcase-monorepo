import type { GameAggregate } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'
import type { GameWonEvent } from '~src/services/connectFour/aggregates/Game/events/GameWon/GameWonEvent'

export const onGameWon = (
  aggregate: GameAggregate | null,
  event: GameWonEvent,
): GameAggregate | null => {
  /* v8 ignore next 3 */
  if (aggregate == null) {
    return null
  }

  return {
    ...aggregate,
    status: 'won',
    winner: event.data.winner,
  }
}
