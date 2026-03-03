/* v8 ignore start */
import { act, fireEvent, screen } from '@testing-library/react'
import { queryClient } from '~src/test/globals'
import { When } from '~src/utils/testing/bddSteps'
import { waitForQueries } from '~src/utils/testing/waitForQueries'

When(/I click cell \((\d), (\d)\)$/, async ({ params }) => {
  const [, row, col] = params

  const element = await screen.findByTestId(
    `game-cell-${row}-${col}`,
    {},
    { timeout: 10_000 },
  )

  act(() => {
    fireEvent.click(element)
  })

  await waitForQueries(queryClient, {
    strategy: 'chain-completion',
    timeout: 20_000,
    stableDuration: 1000,
  })
})
