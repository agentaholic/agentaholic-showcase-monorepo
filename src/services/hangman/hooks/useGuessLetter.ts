import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNamespace } from '~src/contexts/NamespaceContext'
import { apiClient } from '~src/utils/api/apiClient'

export const useGuessLetter = (roundId: string) => {
  const queryClient = useQueryClient()
  const { namespace } = useNamespace()

  return useMutation({
    mutationFn: async (params: { letter: string }) => {
      return apiClient.hangman.guessLetter({
        round: { id: roundId },
        letter: params.letter,
        namespaceSlug: namespace.slug,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['hangman', 'round', roundId],
      })
    },
  })
}
