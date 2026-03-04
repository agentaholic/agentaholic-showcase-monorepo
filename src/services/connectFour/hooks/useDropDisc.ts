import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNamespace } from '~src/contexts/NamespaceContext'
import { apiClient } from '~src/utils/api/apiClient'

export const useDropDisc = (gameId: string) => {
  const queryClient = useQueryClient()
  const { namespace } = useNamespace()

  return useMutation({
    mutationFn: async (params: {
      player: 'Red' | 'Yellow'
      column: number
    }) => {
      return apiClient.connectFour.dropDisc({
        game: { id: gameId },
        player: params.player,
        column: params.column,
        namespaceSlug: namespace.slug,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['connectFour', 'game', gameId],
      })
    },
  })
}
