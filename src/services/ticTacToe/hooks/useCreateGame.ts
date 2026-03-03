import { useMutation } from '@tanstack/react-query'
import { useNamespace } from '~src/contexts/NamespaceContext'
import { apiClient } from '~src/utils/api/apiClient'

export const useCreateGame = () => {
  const { namespace } = useNamespace()

  return useMutation({
    mutationFn: async () => {
      return apiClient.ticTacToe.createGame({ namespaceSlug: namespace.slug })
    },
  })
}
