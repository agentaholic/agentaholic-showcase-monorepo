/* v8 ignore start */
import { expect } from 'vitest'
import { routerRef } from '~src/test/globals'
import { Then } from '~src/utils/testing/bddSteps'

Then(/I should be on the "([^"]*)" route$/, ({ params }) => {
  const [, route] = params

  if (routerRef.current == null) {
    throw new Error('no routerRef')
  }

  expect(routerRef.current.location.pathname).toMatch(new RegExp(`^${route}$`))
})
