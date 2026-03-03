import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'
import type { RoundWonEvent } from '~src/services/hangman/aggregates/Round/events/RoundWon/RoundWonEvent'

export const onRoundWon = (
  aggregate: RoundAggregate | null,
  _event: RoundWonEvent,
): RoundAggregate | null => {
  /* v8 ignore next 3 */
  if (aggregate == null) {
    return null
  }
  return { ...aggregate, status: 'won' }
}
