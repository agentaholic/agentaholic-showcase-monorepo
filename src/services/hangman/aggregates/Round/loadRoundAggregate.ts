import { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'
import { loadAggregate } from '~src/services/events/utils/loadAggregate'
import { RoundEvent } from '~src/services/hangman/aggregates/Round/RoundEvent'
import { roundAggregateReducer } from './roundAggregateReducer'

export async function loadRoundAggregate(params: {
  id: string
  namespace: { slug: string }
}): Promise<RoundAggregate | null> {
  return loadAggregate<RoundEvent, RoundAggregate>({
    ...params,
    service: { name: 'hangman' },
    name: 'Round',
    reducer: roundAggregateReducer,
  })
}
