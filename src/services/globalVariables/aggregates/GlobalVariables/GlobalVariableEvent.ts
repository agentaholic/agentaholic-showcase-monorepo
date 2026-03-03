import type { GlobalVariableSetEvent } from '~src/services/globalVariables/aggregates/GlobalVariables/events/GlobalVariableSet/GlobalVariableSetEvent'
import type { GlobalVariableUnsetEvent } from '~src/services/globalVariables/aggregates/GlobalVariables/events/GlobalVariableUnset/GlobalVariableUnsetEvent'

export type GlobalVariableEvent =
  | GlobalVariableSetEvent
  | GlobalVariableUnsetEvent
