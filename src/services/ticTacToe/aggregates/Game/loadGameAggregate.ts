import { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'
import { loadAggregate } from '~src/services/events/utils/loadAggregate'
import { GameEvent } from '~src/services/ticTacToe/aggregates/Game/GameEvent'
import { gameAggregateReducer } from './gameAggregateReducer'

export async function loadGameAggregate(params: {
  id: string
  namespace: { slug: string }
}): Promise<GameAggregate | null> {
  return loadAggregate<GameEvent, GameAggregate>({
    ...params,
    service: { name: 'ticTacToe' },
    name: 'Game',
    reducer: gameAggregateReducer,
  })
}
