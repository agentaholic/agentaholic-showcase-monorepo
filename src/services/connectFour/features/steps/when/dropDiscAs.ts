/* v8 ignore start */
import { apiClient } from '~src/utils/api/apiClient'
import { When } from '~src/utils/testing/bddSteps'
import { currentGameId } from '~src/services/connectFour/features/gameTestContext'
import { queryClient } from '~src/test/globals'
import { waitForQueries } from '~src/utils/testing/waitForQueries'

When(
  /player (Red|Yellow) drops disc in column (\d)$/,
  async ({ params, scenario }) => {
    const [, player, col] = params

    await apiClient.connectFour.dropDisc({
      game: { id: currentGameId() },
      player: player as 'Red' | 'Yellow',
      column: Number(col),
      namespaceSlug: scenario.id,
    })

    await queryClient.invalidateQueries({
      queryKey: ['connectFour', 'game', currentGameId()],
    })

    await waitForQueries(queryClient, {
      strategy: 'chain-completion',
      timeout: 20_000,
      stableDuration: 500,
    })
  },
)
