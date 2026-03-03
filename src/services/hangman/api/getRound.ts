import { api, APIError, ErrCode, Header } from 'encore.dev/api'
import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'
import { loadRoundAggregate } from '~src/services/hangman/aggregates/Round/loadRoundAggregate'

interface GetRoundRequest {
  id: string
  namespaceSlug?: Header<'X-Namespace-Slug'>
}

interface GetRoundResponse {
  aggregate: RoundAggregate
}

export const getRound = api(
  { expose: true, method: 'POST' },
  async (params: GetRoundRequest): Promise<GetRoundResponse> => {
    const { id, namespaceSlug = 'main' } = params

    const namespace = { slug: namespaceSlug }

    const aggregate = await loadRoundAggregate({ id, namespace })

    if (aggregate == null) {
      throw new APIError(ErrCode.NotFound, `Round with ID ${id} not found`)
    }

    const sanitizedAggregate =
      aggregate.status === 'inProgress' ? { ...aggregate, word: '' } : aggregate

    return { aggregate: sanitizedAggregate }
  },
)
