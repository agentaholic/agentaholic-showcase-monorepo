import type { GlobalVariableAggregate } from '~src/services/globalVariables/aggregates/GlobalVariables/types/GlobalVariableAggregate'
import type { GlobalVariableUnsetEvent } from '~src/services/globalVariables/aggregates/GlobalVariables/events/GlobalVariableUnset/GlobalVariableUnsetEvent'

export const onGlobalVariableUnset = (
  _aggregate: GlobalVariableAggregate | null,
  _event: GlobalVariableUnsetEvent,
): GlobalVariableAggregate | null => {
  return null
}
