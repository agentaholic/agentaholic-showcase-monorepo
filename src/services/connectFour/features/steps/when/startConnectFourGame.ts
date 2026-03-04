/* v8 ignore start */
import { act, fireEvent, screen } from '@testing-library/react'
import { queryClient } from '~src/test/globals'
import { When } from '~src/utils/testing/bddSteps'
import { waitForQueries } from '~src/utils/testing/waitForQueries'
import { setCurrentGameId } from '~src/services/connectFour/features/gameTestContext'

When(/I start a new connect four game$/, async () => {
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

  // Extract game ID from the query cache — useConnectFourGame stores data under ['connectFour', 'game', gameId]
  const queries = queryClient.getQueryCache().findAll({
    queryKey: ['connectFour', 'game'],
  })

  const successfulQueries = queries.filter((q) => q.state.status === 'success')
  if (successfulQueries.length === 0) {
    throw new Error('No successful connectFour game query found in cache')
  }

  const mostRecentQuery = successfulQueries.sort(
    (a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt,
  )[0]

  const gameId = mostRecentQuery.queryKey[2] as string
  setCurrentGameId(gameId)
})
