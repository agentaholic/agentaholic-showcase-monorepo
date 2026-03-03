/* v8 ignore start */
import { QueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate, useParams } from 'react-router'

interface RouterContext {
  navigate: ReturnType<typeof useNavigate>
  location: ReturnType<typeof useLocation>
  params: ReturnType<typeof useParams>
}

export const routerRef = { current: null as null | RouterContext }

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      throwOnError: true,
    },
    mutations: {
      retry: false,
      throwOnError: true,
    },
  },
})
