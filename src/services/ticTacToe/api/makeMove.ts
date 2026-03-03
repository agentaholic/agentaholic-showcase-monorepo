import { api, APIError, ErrCode, Header } from 'encore.dev/api'
import { events } from '~encore/clients'
import type { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'
import type { GameEvent } from '~src/services/ticTacToe/aggregates/Game/GameEvent'
import { loadGameAggregate } from '~src/services/ticTacToe/aggregates/Game/loadGameAggregate'
import { gameAggregateReducer } from '~src/services/ticTacToe/aggregates/Game/gameAggregateReducer'
import { validateMove } from '~src/services/ticTacToe/utils/validateMove'
import { checkForWinner } from '~src/services/ticTacToe/utils/checkForWinner'
import { checkForDraw } from '~src/services/ticTacToe/utils/checkForDraw'
import type { MoveMadeEvent } from '~src/services/ticTacToe/aggregates/Game/events/MoveMade/MoveMadeEvent'
import type { GameWonEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameWon/GameWonEvent'
import type { GameDrawnEvent } from '~src/services/ticTacToe/aggregates/Game/events/GameDrawn/GameDrawnEvent'
import { generateId } from '~src/utils/id/generateId'

interface MakeMoveRequest {
  game: { id: string }
  player: 'X' | 'O'
  row: number
  column: number
  namespaceSlug?: Header<'X-Namespace-Slug'>
}

export interface MakeMoveResponse {
  aggregate: GameAggregate
}

export const makeMove = api(
  { expose: true, method: 'POST' },
  async (params: MakeMoveRequest): Promise<MakeMoveResponse> => {
    const { game, player, row, column, namespaceSlug = 'main' } = params

    const namespace = { slug: namespaceSlug }

    const aggregate = await loadGameAggregate({ id: game.id, namespace })

    if (aggregate == null) {
      throw new APIError(ErrCode.NotFound, `Game with ID ${game.id} not found`)
    }

    const validation = validateMove({ aggregate, player, row, column })

    if (!validation.valid) {
      throw new APIError(ErrCode.FailedPrecondition, validation.reason)
    }

    const moveEvent: MoveMadeEvent = {
      name: 'MoveMade',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'ticTacToe' },
      },
      data: { player, row, column },
    }

    const eventsToCommit: Array<GameEvent> = [moveEvent]

    const afterMove = gameAggregateReducer(aggregate, moveEvent)

    /* v8 ignore next 3 */
    if (afterMove == null) {
      throw new APIError(ErrCode.Internal, 'Failed to apply move')
    }

    const winner = checkForWinner(afterMove.board)

    if (winner != null) {
      const wonEvent: GameWonEvent = {
        name: 'GameWon',
        version: 1,
        id: generateId({ mode: 'random' }),
        aggregate: {
          name: 'Game',
          id: game.id,
          service: { name: 'ticTacToe' },
        },
        data: { winner },
      }
      eventsToCommit.push(wonEvent)
    } else if (checkForDraw(afterMove.board)) {
      const drawnEvent: GameDrawnEvent = {
        name: 'GameDrawn',
        version: 1,
        id: generateId({ mode: 'random' }),
        aggregate: {
          name: 'Game',
          id: game.id,
          service: { name: 'ticTacToe' },
        },
        data: {},
      }
      eventsToCommit.push(drawnEvent)
    }

    await events.commitTransaction({
      events: eventsToCommit,
      namespace,
    })

    let finalAggregate = afterMove
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
