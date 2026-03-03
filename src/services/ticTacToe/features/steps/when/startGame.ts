/* v8 ignore start */
import { act, fireEvent, screen } from '@testing-library/react'
import { queryClient } from '~src/test/globals'
import { When } from '~src/utils/testing/bddSteps'
import { waitForQueries } from '~src/utils/testing/waitForQueries'
import { setCurrentGameId } from '~src/services/ticTacToe/features/gameTestContext'

When(/I start a new game$/, async () => {
  const button = await screen.findByTestId(
    'new-game-button',
    {},
    { timeout: 10_000 },
  )

  act(() => {
    fireEvent.click(button)
  })

  await waitForQueries(queryClient, {
    strategy: 'chain-completion',
    timeout: 20_000,
    stableDuration: 500,
  })

  // Wait for game-status to appear, confirming a game is loaded
  await screen.findByTestId('game-status', {}, { timeout: 10_000 })

  // Extract game ID from the query cache — useGame stores data under ['ticTacToe', 'game', gameId]
  // Find the most recently updated successful game query (the one just created)
  const queries = queryClient.getQueryCache().findAll({
    queryKey: ['ticTacToe', 'game'],
  })

  const successfulQueries = queries.filter((q) => q.state.status === 'success')
  if (successfulQueries.length === 0) {
    throw new Error('No successful ticTacToe game query found in cache')
  }

  // Sort by last updated time descending to get the most recently created game
  const mostRecentQuery = successfulQueries.sort(
    (a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt,
  )[0]

  const gameId = mostRecentQuery.queryKey[2] as string
  setCurrentGameId(gameId)
})
