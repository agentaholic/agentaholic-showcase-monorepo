import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNamespace } from '~src/contexts/NamespaceContext'
import { apiClient } from '~src/utils/api/apiClient'

export const useMakeMove = (gameId: string) => {
  const queryClient = useQueryClient()
  const { namespace } = useNamespace()

  return useMutation({
    mutationFn: async (params: {
      player: 'X' | 'O'
      row: number
      column: number
    }) => {
      return apiClient.ticTacToe.makeMove({
        game: { id: gameId },
        player: params.player,
        row: params.row,
        column: params.column,
        namespaceSlug: namespace.slug,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['ticTacToe', 'game', gameId],
      })
    },
  })
}
