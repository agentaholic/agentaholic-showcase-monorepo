/* v8 ignore start */
import { screen } from '@testing-library/react'
import { expect } from 'vitest'
import { Then } from '~src/utils/testing/bddSteps'

Then(
  /the connect four game status should (contain|be) "([^"]+)"$/,
  async ({ params }) => {
    const [, matchType, expectedText] = params

    const element = await screen.findByTestId(
      'game-status',
      {},
      { timeout: 10_000 },
    )

    if (matchType === 'contain') {
      expect(element.textContent).toContain(expectedText)
    } else {
      expect(element.textContent).toBe(expectedText)
    }
  },
)
