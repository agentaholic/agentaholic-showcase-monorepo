export type BaseDomainEvent = {
  id: string
  version: number
  name: string
  aggregate: {
    name: string
    id: string | number
    service: { name: string }
  }
  data: unknown
  metadata: {
    timestamp: string
    namespace: { slug: string }
    transaction: { id: string }
    traceId?: string
    spanId?: string
  }
}
