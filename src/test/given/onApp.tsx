/* v8 ignore start */
import { render } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import { MemoryRouter, useLocation, useNavigate, useParams } from 'react-router'
import { App } from '~src/app/App'
import { queryClient, routerRef } from '~src/test/globals'
import { Given } from '~src/utils/testing/bddSteps'

Given('I am on the app', (fixtures) => {
  function RouterCapture() {
    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()
    routerRef.current = { navigate, location, params }
    return null
  }

  let container: ReturnType<typeof render>['baseElement'] | undefined

  const runtimeErrorPromise = new Promise<void>((_resolve, reject) => {
    try {
      const result = render(
        <ErrorBoundary fallback={<>An Error Occurred</>} onError={reject}>
          <MemoryRouter initialEntries={['/']}>
            <RouterCapture />
            <App
              routes={fixtures.routes ?? <></>}
              namespace={{ slug: fixtures.scenario.id }}
              queryClient={queryClient}
            />
          </MemoryRouter>
        </ErrorBoundary>,
        {
          // TODO: `onCaughtError` is a documented feature of the React
          //       testing library, however it seems to never be called.
          //       It would be nice to utilize this instead of using
          //       <ErrorBoundary />
          onCaughtError: ((error: Error) => {
            reject(error)
          }) as unknown as undefined,
        },
      )

      container = result.baseElement
    } catch (error) {
      reject(error as Error)
    }
  })

  if (container == null) {
    throw new Error('failed to render')
  }

  return { backgroundPromise: runtimeErrorPromise }
})
