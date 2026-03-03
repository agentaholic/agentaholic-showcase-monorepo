import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'
import type { RoundLostEvent } from '~src/services/hangman/aggregates/Round/events/RoundLost/RoundLostEvent'

export const onRoundLost = (
  aggregate: RoundAggregate | null,
  _event: RoundLostEvent,
): RoundAggregate | null => {
  /* v8 ignore next 3 */
  if (aggregate == null) {
    return null
  }
  return { ...aggregate, status: 'lost' }
}
