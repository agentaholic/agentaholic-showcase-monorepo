/* v8 ignore start */
import { apiClient } from '~src/utils/api/apiClient'
import { When } from '~src/utils/testing/bddSteps'
import { currentGameId } from '~src/services/ticTacToe/features/gameTestContext'
import { queryClient } from '~src/test/globals'
import { waitForQueries } from '~src/utils/testing/waitForQueries'

When(
  /player (X|O) moves to cell \((\d), (\d)\)$/,
  async ({ params, scenario }) => {
    const [, player, row, col] = params

    await apiClient.ticTacToe.makeMove({
      game: { id: currentGameId() },
      player: player as 'X' | 'O',
      row: Number(row),
      column: Number(col),
      namespaceSlug: scenario.id,
    })

    await queryClient.invalidateQueries({
      queryKey: ['ticTacToe', 'game', currentGameId()],
    })

    await waitForQueries(queryClient, {
      strategy: 'chain-completion',
      timeout: 20_000,
      stableDuration: 500,
    })
  },
)
