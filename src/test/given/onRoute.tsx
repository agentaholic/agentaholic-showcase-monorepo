/* v8 ignore start */
import { act } from '@testing-library/react'
import { queryClient, routerRef } from '~src/test/globals'
import { Given } from '~src/utils/testing/bddSteps'
import { waitForQueries } from '~src/utils/testing/waitForQueries'

Given(/I am on the "([^"]*)" route/, async ({ params }) => {
  const [, route] = params
  act(() => {
    if (routerRef.current == null) {
      throw new Error('no routerRef')
    }

    routerRef.current.navigate(route)
  })

  await waitForQueries(queryClient)
})
