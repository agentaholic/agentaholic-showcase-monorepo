import { api, Header } from 'encore.dev/api'
import { events } from '~encore/clients'
import type { RoundStartedEvent } from '~src/services/hangman/aggregates/Round/events/RoundStarted/RoundStartedEvent'
import { generateId } from '~src/utils/id/generateId'
import { pickRandomWord } from '~src/services/hangman/utils/pickRandomWord'

interface CreateRoundRequest {
  namespaceSlug?: Header<'X-Namespace-Slug'>
}

export interface CreateRoundResponse {
  aggregate: { id: string }
}

export const createRound = api(
  { expose: true, method: 'POST' },
  async (params: CreateRoundRequest): Promise<CreateRoundResponse> => {
    const { namespaceSlug = 'main' } = params
    const namespace = { slug: namespaceSlug }
    const round = { id: generateId({ mode: 'random' }) }

    const event: RoundStartedEvent = {
      name: 'RoundStarted',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { word: pickRandomWord() },
    }

    await events.commitTransaction({ events: [event], namespace })

    return { aggregate: { id: round.id } }
  },
)
