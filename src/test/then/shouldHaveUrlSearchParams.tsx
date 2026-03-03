/* v8 ignore start */
import { expect } from 'vitest'
import { routerRef } from '~src/test/globals'
import { Then } from '~src/utils/testing/bddSteps'

Then(
  /the URL should have search param "([^"]*)" with value "([^"]*)"$/,
  ({ params }) => {
    const [, paramName, expectedValue] = params

    if (routerRef.current == null) {
      throw new Error('no routerRef')
    }

    const searchParams = new URLSearchParams(routerRef.current.location.search)
    const actualValue = searchParams.get(paramName)

    expect(actualValue).toBe(expectedValue)
  },
)
