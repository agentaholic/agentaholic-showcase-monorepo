import { api, APIError, ErrCode, Header } from 'encore.dev/api'
import { events } from '~encore/clients'
import type { GameAggregate } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'
import type { GameEvent } from '~src/services/connectFour/aggregates/Game/GameEvent'
import { loadGameAggregate } from '~src/services/connectFour/aggregates/Game/loadGameAggregate'
import { gameAggregateReducer } from '~src/services/connectFour/aggregates/Game/gameAggregateReducer'
import { validateDrop } from '~src/services/connectFour/utils/validateDrop'
import { findLowestEmptyRow } from '~src/services/connectFour/utils/findLowestEmptyRow'
import { checkForWinner } from '~src/services/connectFour/utils/checkForWinner'
import { checkForDraw } from '~src/services/connectFour/utils/checkForDraw'
import type { GameDiscDroppedEvent } from '~src/services/connectFour/aggregates/Game/events/GameDiscDropped/GameDiscDroppedEvent'
import type { GameWonEvent } from '~src/services/connectFour/aggregates/Game/events/GameWon/GameWonEvent'
import type { GameDrawnEvent } from '~src/services/connectFour/aggregates/Game/events/GameDrawn/GameDrawnEvent'
import { generateId } from '~src/utils/id/generateId'

interface DropDiscRequest {
  game: { id: string }
  player: 'Red' | 'Yellow'
  column: number
  namespaceSlug?: Header<'X-Namespace-Slug'>
}

export interface DropDiscResponse {
  aggregate: GameAggregate
}

export const dropDisc = api(
  { expose: true, method: 'POST' },
  async (params: DropDiscRequest): Promise<DropDiscResponse> => {
    const { game, player, column, namespaceSlug = 'main' } = params

    const namespace = { slug: namespaceSlug }

    const aggregate = await loadGameAggregate({ id: game.id, namespace })

    if (aggregate == null) {
      throw new APIError(ErrCode.NotFound, `Game with ID ${game.id} not found`)
    }

    const validation = validateDrop({ aggregate, player, column })

    if (!validation.valid) {
      throw new APIError(ErrCode.FailedPrecondition, validation.reason)
    }

    const row = findLowestEmptyRow(aggregate.board, column)

    /* v8 ignore next 3 */
    if (row == null) {
      throw new APIError(ErrCode.FailedPrecondition, 'Column is full')
    }

    const discDroppedEvent: GameDiscDroppedEvent = {
      name: 'GameDiscDropped',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'connectFour' },
      },
      data: { player, column, row },
    }

    const eventsToCommit: Array<GameEvent> = [discDroppedEvent]

    const afterDrop = gameAggregateReducer(aggregate, discDroppedEvent)

    /* v8 ignore next 3 */
    if (afterDrop == null) {
      throw new APIError(ErrCode.Internal, 'Failed to apply disc drop')
    }

    const winner = checkForWinner(afterDrop.board)

    if (winner != null) {
      const wonEvent: GameWonEvent = {
        name: 'GameWon',
        version: 1,
        id: generateId({ mode: 'random' }),
        aggregate: {
          name: 'Game',
          id: game.id,
          service: { name: 'connectFour' },
        },
        data: { winner },
      }
      eventsToCommit.push(wonEvent)
    } else if (checkForDraw(afterDrop.board)) {
      const drawnEvent: GameDrawnEvent = {
        name: 'GameDrawn',
        version: 1,
        id: generateId({ mode: 'random' }),
        aggregate: {
          name: 'Game',
          id: game.id,
          service: { name: 'connectFour' },
        },
        data: {},
      }
      eventsToCommit.push(drawnEvent)
    }

    await events.commitTransaction({
      events: eventsToCommit,
      namespace,
    })

    let finalAggregate = afterDrop
    for (const event of eventsToCommit.slice(1)) {
      const result = gameAggregateReducer(finalAggregate, event)
      /* v8 ignore next 3 */
      if (result == null) {
        throw new APIError(ErrCode.Internal, 'Failed to apply event')
      }
      finalAggregate = result
    }

    return { aggregate: finalAggregate }
  },
)
