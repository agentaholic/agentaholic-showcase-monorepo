import { api, APIError, ErrCode, Header } from 'encore.dev/api'
import type { GameAggregate } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'
import { loadGameAggregate } from '~src/services/connectFour/aggregates/Game/loadGameAggregate'

interface GetGameRequest {
  id: string
  namespaceSlug?: Header<'X-Namespace-Slug'>
}

export interface GetGameResponse {
  aggregate: GameAggregate
}

export const getGame = api(
  { expose: true, method: 'POST' },
  async (params: GetGameRequest): Promise<GetGameResponse> => {
    const { id, namespaceSlug = 'main' } = params

    const namespace = { slug: namespaceSlug }

    const aggregate = await loadGameAggregate({ id, namespace })

    /* v8 ignore start */
    if (aggregate == null) {
      throw new APIError(ErrCode.NotFound, `Game with ID ${id} not found`)
    }
    /* v8 ignore stop */

    return { aggregate }
  },
)
