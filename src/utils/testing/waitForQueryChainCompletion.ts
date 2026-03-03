/* v8 ignore start */
import { waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import Debug from 'debug'
const debug = Debug('test')

interface WaitForQueryChainCompletionOptions {
  /**
   * Maximum time to wait in milliseconds
   */
  timeout?: number
  /**
   * Interval between checks in milliseconds
   */
  interval?: number
  /**
   * Minimum stable duration in milliseconds before considering chain complete
   */
  stableDuration?: number
  /**
   * Maximum number of stabilization cycles to allow
   */
  maxCycles?: number
}

interface QueryState {
  fetching: number
  mutating: number
  enabled: number
  timestamp: number
}

/**
 * Waits for React Query chains to fully complete by monitoring:
 * 1. Active fetching/mutating queries
 * 2. Enabled queries that haven't been triggered yet
 * 3. Query invalidations that might trigger new requests
 *
 * This is particularly useful for testing scenarios where:
 * - Navigation triggers new routes with useQuery hooks
 * - Query results enable other queries (dependent queries)
 * - Mutations invalidate queries causing refetches
 */
export async function waitForQueryChainCompletion(
  queryClient: QueryClient,
  options: WaitForQueryChainCompletionOptions = {},
): Promise<void> {
  const {
    timeout = 15_000,
    interval = 50,
    stableDuration = 300,
    maxCycles = 100,
  } = options

  let cycles = 0
  let stableStart: number | null = null
  let lastState: QueryState | null = null

  const getQueryState = (): QueryState => {
    const queryCache = queryClient.getQueryCache()
    const queries = queryCache.getAll()

    const fetching = queryClient.isFetching()
    const mutating = queryClient.isMutating()

    // Count queries that are enabled but not currently fetching
    // These might trigger soon
    const enabled = queries.filter((query) => {
      const { enabled } = query.options as { enabled?: boolean } // oxlint-disable-line no-shadow
      return enabled !== false && query.state.fetchStatus === 'idle'
    }).length

    return {
      fetching,
      mutating,
      enabled,
      timestamp: Date.now(),
    }
  }

  // Set up listeners for query cache events to detect new queries
  let hasNewActivity = false
  const queryCache = queryClient.getQueryCache()
  const mutationCache = queryClient.getMutationCache()

  const handleQueryAdded = () => {
    debug('New query added to cache')
    hasNewActivity = true
    stableStart = null
  }

  const handleQueryUpdated = () => {
    hasNewActivity = true
    stableStart = null
  }

  const handleMutationAdded = () => {
    debug('New mutation added to cache')
    hasNewActivity = true
    stableStart = null
  }

  // Subscribe to cache events
  const unsubscribeQueryAdded = queryCache.subscribe(handleQueryAdded)
  const unsubscribeQueryUpdated = queryCache.subscribe(handleQueryUpdated)
  const unsubscribeMutationAdded = mutationCache.subscribe(handleMutationAdded)

  try {
    await waitFor(
      () => {
        cycles++
        const currentState = getQueryState()

        debug(
          `Cycle ${cycles}: fetching=${currentState.fetching}, ` +
            `mutating=${currentState.mutating}, enabled=${currentState.enabled}`,
        )

        if (cycles >= maxCycles) {
          throw new Error(
            `Query chain completion failed after ${maxCycles} cycles. ` +
              `Final state: ${JSON.stringify(currentState)}`,
          )
        }

        const active = currentState.fetching > 0 || currentState.mutating > 0

        // Check if there's been new activity since last check
        if (hasNewActivity) {
          debug('New activity detected, resetting stability timer')
          hasNewActivity = false
          stableStart = null
          lastState = currentState
          throw new Error('New activity detected')
        }

        // If queries are still active, reset stability timer
        if (active) {
          debug('Queries still active, resetting stability timer')
          stableStart = null
          lastState = currentState
          throw new Error('Queries still active')
        }

        // Check if state has changed (new enabled queries appeared)
        if (lastState && currentState.enabled !== lastState.enabled) {
          debug(
            `Enabled query count changed: ${lastState.enabled} -> ${currentState.enabled}`,
          )
          stableStart = null
        }

        const now = Date.now()

        // Start stability timer if not already started
        if (stableStart === null) {
          stableStart = now
          debug(`Starting stability timer at ${stableStart}`)
          lastState = currentState
          throw new Error('Starting stability check')
        }

        const stableDurationMs = now - stableStart

        if (stableDurationMs < stableDuration) {
          debug(
            `Stable for ${stableDurationMs}ms, need ${stableDuration}ms total`,
          )
          lastState = currentState
          throw new Error('Not stable long enough')
        }

        debug(
          `Stable for ${stableDurationMs}ms with no active queries - chain complete!`,
        )
        lastState = currentState
      },
      {
        timeout,
        interval,
      },
    )
  } finally {
    // Clean up event listeners
    unsubscribeQueryAdded()
    unsubscribeQueryUpdated()
    unsubscribeMutationAdded()
  }
}
