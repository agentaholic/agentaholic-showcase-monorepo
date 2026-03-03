import type { GlobalVariableAggregate } from '~src/services/globalVariables/aggregates/GlobalVariables/types/GlobalVariableAggregate'
import type { GlobalVariableSetEvent } from '~src/services/globalVariables/aggregates/GlobalVariables/events/GlobalVariableSet/GlobalVariableSetEvent'

export const onGlobalVariableSet = (
  _aggregate: GlobalVariableAggregate | null,
  event: GlobalVariableSetEvent,
): GlobalVariableAggregate => {
  return {
    id: event.aggregate.id,
    value: event.data.value,
  }
}
