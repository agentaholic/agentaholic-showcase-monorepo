import { useQuery } from '@tanstack/react-query'
import { useNamespace } from '~src/contexts/NamespaceContext'
import { apiClient } from '~src/utils/api/apiClient'

export const useRound = (roundId: string | undefined) => {
  const { namespace } = useNamespace()

  return useQuery({
    queryKey: ['hangman', 'round', roundId],
    queryFn: async () => {
      if (roundId === undefined) throw new Error('roundId is required')
      return apiClient.hangman.getRound({
        id: roundId,
        namespaceSlug: namespace.slug,
      })
    },
    enabled: roundId !== undefined,
  })
}
