import { api, Header } from 'encore.dev/api'
import { events } from '~encore/clients'
import type { GlobalVariableSetEvent } from '~src/services/globalVariables/aggregates/GlobalVariables/events/GlobalVariableSet/GlobalVariableSetEvent'
import type { GlobalVariableAggregate } from '~src/services/globalVariables/aggregates/GlobalVariables/types/GlobalVariableAggregate'
import { generateId } from '~src/utils/id/generateId'

interface SetGlobalVariableRequest {
  namespaceSlug?: Header<'X-Namespace-Slug'>
  key: string
  value: string
}

interface SetGlobalVariableResponse {
  aggregate: GlobalVariableAggregate
}

export const setGlobalVariable = api(
  { expose: false, method: 'POST' },
  async (
    params: SetGlobalVariableRequest,
  ): Promise<SetGlobalVariableResponse> => {
    const { namespaceSlug = 'main', key, value } = params
    const namespace = { slug: namespaceSlug }

    const aggregateId = key

    const event: GlobalVariableSetEvent = {
      name: 'GlobalVariableSet',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: {
        name: 'GlobalVariable',
        id: aggregateId,
        service: { name: 'globalVariables' },
      },
      data: { value },
    }

    await events.commitTransaction({ events: [event], namespace })

    return { aggregate: { id: aggregateId, value } }
  },
)
