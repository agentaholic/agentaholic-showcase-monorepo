import { GlobalVariableEvent } from '~src/services/globalVariables/aggregates/GlobalVariables/GlobalVariableEvent'
import { onGlobalVariableSet } from '~src/services/globalVariables/aggregates/GlobalVariables/events/GlobalVariableSet/onGlobalVariableSet'
import { onGlobalVariableUnset } from '~src/services/globalVariables/aggregates/GlobalVariables/events/GlobalVariableUnset/onGlobalVariableUnset'
import { GlobalVariableAggregate } from '~src/services/globalVariables/aggregates/GlobalVariables/types/GlobalVariableAggregate'
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports

export const globalVariableAggregateReducer = (
  aggregate: GlobalVariableAggregate | null,
  event: GlobalVariableEvent,
): GlobalVariableAggregate | null => {
  switch (event.name) {
    case 'GlobalVariableSet':
      return onGlobalVariableSet(aggregate, event)

    case 'GlobalVariableUnset':
      return onGlobalVariableUnset(aggregate, event)

    // DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new event handlers
  }
}
