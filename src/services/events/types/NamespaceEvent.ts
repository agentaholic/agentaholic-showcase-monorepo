export type NamespaceEvent<T> = T & {
  metadata: {
    timestamp: string
    namespace: { slug: string }
    transaction: { id: string }
    revision: number
  }
}
