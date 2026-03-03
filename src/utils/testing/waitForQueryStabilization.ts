/* v8 ignore start */
import { waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import Debug from 'debug'
const debug = Debug('test:waitForQueryStabilization')

interface WaitForQueryStabilizationOptions {
  /**
   * Maximum time to wait in milliseconds
   */
  timeout?: number
  /**
   * Interval between checks in milliseconds
   */
  interval?: number
  /**
   * Minimum stable duration in milliseconds before considering queries stable
   */
  stableDuration?: number
  /**
   * Maximum number of stabilization attempts
   */
  maxAttempts?: number
  /**
   * Whether to log debug information
   */
  debug?: boolean
}

/**
 * Waits for React Query to stabilize by ensuring no queries are fetching or mutating
 * for a specified duration. This handles chained queries where new queries may start
 * after others complete.
 */
export async function waitForQueryStabilization(
  queryClient: QueryClient,
  options: WaitForQueryStabilizationOptions = {},
): Promise<void> {
  const {
    timeout = 10_000,
    interval = 50,
    stableDuration = 200,
    maxAttempts = 50,
  } = options

  let attempts = 0
  let stableStart: number | null = null

  await waitFor(
    () => {
      attempts++
      const fetching = queryClient.isFetching()
      const mutating = queryClient.isMutating()
      const active = fetching > 0 || mutating > 0

      debug(`Attempt ${attempts}: fetching=${fetching}, mutating=${mutating}`)
      if (attempts >= maxAttempts) {
        throw new Error(
          `Query stabilization failed after ${maxAttempts} attempts. ` +
            `Final state: fetching=${fetching}, mutating=${mutating}`,
        )
      }

      if (active) {
        // Reset stable timer if queries are active
        stableStart = null
        debug('Queries active, resetting stable timer')
        throw new Error('Queries still active')
      }

      // Queries are idle, check if they've been stable long enough
      const now = Date.now()

      if (stableStart === null) {
        stableStart = now
        debug(`Starting stability timer at ${stableStart}`)
        throw new Error('Starting stability check')
      }

      const stableDurationMs = now - stableStart

      if (stableDurationMs < stableDuration) {
        debug(
          `Stable for ${stableDurationMs}ms, need ${stableDuration}ms total`,
        )
        throw new Error('Not stable long enough')
      }

      debug(`Stable for ${stableDurationMs}ms - success!`)
    },
    {
      timeout,
      interval,
    },
  )
}
