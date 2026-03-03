import { createContext, ReactNode, useContext } from 'react'

interface NamespaceContextValue {
  namespace: {
    slug: string
  }
}

const NamespaceContext = createContext<NamespaceContextValue | null>(null)

interface NamespaceProviderProps {
  children: ReactNode
  namespace: {
    slug: string
  }
}

export function NamespaceProvider({
  children,
  namespace,
}: NamespaceProviderProps) {
  return (
    <NamespaceContext.Provider value={{ namespace }}>
      {children}
    </NamespaceContext.Provider>
  )
}

export function useNamespace() {
  const context = useContext(NamespaceContext)
  /* v8 ignore start */
  if (!context) {
    throw new Error('useNamespace must be used within a NamespaceProvider')
  }
  /* v8 ignore stop */
  return context
}
