import { useQuery } from '@tanstack/react-query'
import { useNamespace } from '~src/contexts/NamespaceContext'
import { apiClient } from '~src/utils/api/apiClient'

export const useGame = (gameId: string | undefined) => {
  const { namespace } = useNamespace()

  return useQuery({
    queryKey: ['ticTacToe', 'game', gameId],
    queryFn: async () => {
      if (gameId === undefined) throw new Error('gameId is required')
      return apiClient.ticTacToe.getGame({
        id: gameId,
        namespaceSlug: namespace.slug,
      })
    },
    enabled: gameId !== undefined,
  })
}
