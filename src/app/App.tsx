import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NamespaceProvider } from '~src/contexts/NamespaceContext'

export type AppProps = {
  queryClient?: QueryClient
  namespace?: {
    slug: string
  }
  routes: React.ReactNode
}

export const App = (props: AppProps) => {
  const {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          throwOnError: true,
        },
        mutations: {
          throwOnError: true,
        },
      },
    }),
    namespace = { slug: 'main' },
    routes,
  } = props

  return (
    <QueryClientProvider client={queryClient}>
      <NamespaceProvider namespace={namespace}>{routes}</NamespaceProvider>
    </QueryClientProvider>
  )
}
