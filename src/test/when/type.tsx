/* v8 ignore start */
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { When } from '~src/utils/testing/bddSteps'

When(/I type "([^"]*)" into "([^"]*)"$/, async ({ params }) => {
  const [, value, testId] = params

  act(() => {
    fireEvent.change(screen.getByTestId(testId), {
      target: { value },
    })
  })

  // Wait for form validation and re-renders to complete
  await waitFor(
    () => {
      // Just wait for the next tick to allow React to process state updates
    },
    { timeout: 1000 },
  )
})
