/* v8 ignore start */
import { screen } from '@testing-library/react'
import { expect } from 'vitest'
import { Then } from '~src/utils/testing/bddSteps'

Then(/the "([^"]*)" element should (not )?be visible$/, ({ params }) => {
  const [, testId, notVisible] = params
  if (notVisible) {
    expect(screen.queryByTestId(testId)).not.toBeInTheDocument()
  } else {
    expect(screen.queryByTestId(testId)).toBeInTheDocument()
  }
})

Then(/the "([^"]*)" should (not )?be disabled$/, ({ params }) => {
  const [, testId, notDisabled] = params
  const element = screen.getByTestId(testId)
  if (notDisabled) {
    expect(element).not.toBeDisabled()
  } else {
    expect(element).toBeDisabled()
  }
})
