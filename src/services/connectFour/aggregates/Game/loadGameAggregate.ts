import type { GameAggregate } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'
import { loadAggregate } from '~src/services/events/utils/loadAggregate'
import type { GameEvent } from '~src/services/connectFour/aggregates/Game/GameEvent'
import { gameAggregateReducer } from '~src/services/connectFour/aggregates/Game/gameAggregateReducer'

export async function loadGameAggregate(params: {
  id: string
  namespace: { slug: string }
}): Promise<GameAggregate | null> {
  return loadAggregate<GameEvent, GameAggregate>({
    ...params,
    service: { name: 'connectFour' },
    name: 'Game',
    reducer: gameAggregateReducer,
  })
}
