export type GlobalVariableUnsetEvent = {
  id: string
  name: 'GlobalVariableUnset'
  version: 1
  aggregate: {
    name: 'GlobalVariable'
    id: string
    service: { name: 'globalVariables' }
  }
  data: Record<string, never>
}
