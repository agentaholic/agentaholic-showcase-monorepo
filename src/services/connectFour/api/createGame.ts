import { api, Header } from 'encore.dev/api'
import { events } from '~encore/clients'
import type { GameStartedEvent } from '~src/services/connectFour/aggregates/Game/events/GameStarted/GameStartedEvent'
import { generateId } from '~src/utils/id/generateId'

interface CreateGameRequest {
  namespaceSlug?: Header<'X-Namespace-Slug'>
}

export interface CreateGameResponse {
  aggregate: { id: string }
}

export const createGame = api(
  { expose: true, method: 'POST' },
  async (params: CreateGameRequest): Promise<CreateGameResponse> => {
    const { namespaceSlug = 'main' } = params

    const namespace = { slug: namespaceSlug }
    const game = { id: generateId({ mode: 'random' }) }

    const event: GameStartedEvent = {
      name: 'GameStarted',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: {
        name: 'Game',
        id: game.id,
        service: { name: 'connectFour' },
      },
      data: {
        firstPlayer: 'Red',
      },
    }

    await events.commitTransaction({
      events: [event],
      namespace,
    })

    return {
      aggregate: { id: game.id },
    }
  },
)
