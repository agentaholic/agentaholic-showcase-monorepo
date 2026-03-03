import type { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'
import type { GameDrawnEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameDrawn/GameDrawnEvent'

export const onGameDrawn = (
  aggregate: GameAggregate | null,
  _event: GameDrawnEvent,
): GameAggregate | null => {
  /* v8 ignore next 3 */
  if (aggregate == null) {
    return null
  }

  return {
    ...aggregate,
    status: 'drawn',
  }
}
