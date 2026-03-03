/* v8 ignore start */
import { act, fireEvent, screen } from '@testing-library/react'
import { queryClient } from '~src/test/globals'
import { When } from '~src/utils/testing/bddSteps'
import { waitForQueries } from '~src/utils/testing/waitForQueries'

When(/I click "([^"]*)"$/, async ({ params }) => {
  const [, testId] = params

  // Wait for the element to appear before clicking (handles async rendering)
  const element = await screen.findByTestId(testId, {}, { timeout: 10_000 })

  act(() => {
    fireEvent.click(element)
  })

  // Use hybrid strategy to handle both simple and complex query chains
  await waitForQueries(queryClient, {
    strategy: 'hybrid',
    timeout: 20_000,
    stableDuration: 600, // Increase to 600ms to account for animations
  })
})
