import { api, APIError, ErrCode, Header } from 'encore.dev/api'
import { loadGlobalVariableAggregate } from '~src/services/globalVariables/aggregates/GlobalVariables/loadGlobalVariableAggregate'
import type { GlobalVariableAggregate } from '~src/services/globalVariables/aggregates/GlobalVariables/types/GlobalVariableAggregate'

interface GetGlobalVariableRequest {
  namespaceSlug?: Header<'X-Namespace-Slug'>
  key: string
  defaultValue?: string
}

interface GetGlobalVariableResponse {
  aggregate: GlobalVariableAggregate
}

export const getGlobalVariable = api(
  { expose: false, method: 'GET' },
  async (
    params: GetGlobalVariableRequest,
  ): Promise<GetGlobalVariableResponse> => {
    const { namespaceSlug = 'main', key, defaultValue } = params
    const namespace = { slug: namespaceSlug }

    // Load the aggregate (ID = namespace slug)
    const aggregate = await loadGlobalVariableAggregate({
      id: key,
      namespace,
    })

    // Check if key exists
    if (!aggregate) {
      if (defaultValue != null) {
        return { aggregate: { id: key, value: defaultValue } }
      }

      throw new APIError(
        ErrCode.NotFound,
        `Global variable with key "${key}" not found`,
      )
    }

    return { aggregate }
  },
)
