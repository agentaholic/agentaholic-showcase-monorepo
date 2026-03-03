import { api, APIError, ErrCode, Header } from 'encore.dev/api'
import { events } from '~encore/clients'
import type { GlobalVariableUnsetEvent } from '~src/services/globalVariables/aggregates/GlobalVariables/events/GlobalVariableUnset/GlobalVariableUnsetEvent'
import { loadGlobalVariableAggregate } from '~src/services/globalVariables/aggregates/GlobalVariables/loadGlobalVariableAggregate'
import { generateId } from '~src/utils/id/generateId'

interface UnsetGlobalVariableRequest {
  namespaceSlug?: Header<'X-Namespace-Slug'>
  key: string
}

interface UnsetGlobalVariableResponse {
  aggregate: { id: string }
}

export const unsetGlobalVariable = api(
  { expose: false, method: 'DELETE' },
  async (
    params: UnsetGlobalVariableRequest,
  ): Promise<UnsetGlobalVariableResponse> => {
    const { namespaceSlug = 'main', key } = params
    const namespace = { slug: namespaceSlug }

    // Load the aggregate
    const aggregate = await loadGlobalVariableAggregate({
      id: key,
      namespace,
    })

    // Check if key exists
    if (!aggregate) {
      throw new APIError(
        ErrCode.NotFound,
        `Global variable with key "${key}" not found`,
      )
    }

    const event: GlobalVariableUnsetEvent = {
      name: 'GlobalVariableUnset',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: {
        name: 'GlobalVariable',
        id: key,
        service: { name: 'globalVariables' },
      },
      data: {},
    }

    await events.commitTransaction({ events: [event], namespace })

    return { aggregate: { id: key } }
  },
)
