import { loadAggregate } from '~src/services/events/utils/loadAggregate'
import type { GlobalVariableEvent } from '~src/services/globalVariables/aggregates/GlobalVariables/GlobalVariableEvent'
import { globalVariableAggregateReducer } from '~src/services/globalVariables/aggregates/GlobalVariables/globalVariableAggregateReducer'
import type { GlobalVariableAggregate } from '~src/services/globalVariables/aggregates/GlobalVariables/types/GlobalVariableAggregate'

export async function loadGlobalVariableAggregate(params: {
  id: string
  namespace: { slug: string }
}): Promise<GlobalVariableAggregate | null> {
  return loadAggregate<GlobalVariableEvent, GlobalVariableAggregate>({
    ...params,
    service: { name: 'globalVariables' },
    name: 'GlobalVariable',
    reducer: globalVariableAggregateReducer,
  })
}
