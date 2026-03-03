export type GlobalVariableSetEvent = {
  id: string
  name: 'GlobalVariableSet'
  version: 1
  aggregate: {
    name: 'GlobalVariable'
    id: string
    service: { name: 'globalVariables' }
  }
  data: {
    value: string
  }
}
