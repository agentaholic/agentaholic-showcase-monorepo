/* v8 ignore start */
import { screen } from '@testing-library/react'
import { expect } from 'vitest'
import { Then } from '~src/utils/testing/bddSteps'

Then(/the "([^"]*)" should have value "([^"]*)"$/, ({ params }) => {
  const [, testId, expectedValue] = params
  const element: HTMLInputElement = screen.getByTestId(testId)

  expect(element.value).toBe(expectedValue)
})
