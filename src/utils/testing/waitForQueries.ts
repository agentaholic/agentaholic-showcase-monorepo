/* v8 ignore start */
import { QueryClient } from '@tanstack/react-query'
import { waitForQueryStabilization } from '~src/utils/testing/waitForQueryStabilization'
import { waitForQueryChainCompletion } from '~src/utils/testing/waitForQueryChainCompletion'
import Debug from 'debug'
const debug = Debug('test')

interface WaitForQueriesOptions {
  /**
   * Maximum time to wait in milliseconds
   * @default 25000
   */
  timeout?: number
  /**
   * Interval between checks in milliseconds
   * @default 50
   */
  interval?: number
  /**
   * Minimum stable duration in milliseconds before considering queries stable
   * @default 300
   */
  stableDuration?: number
  /**
   * Strategy for waiting:
   * - 'stabilization': Wait for queries to be idle for stableDuration
   * - 'chain-completion': Monitor query cache for new queries and invalidations
   * - 'hybrid': Try stabilization first, then chain-completion if needed
   * @default 'hybrid'
   */
  strategy?: 'stabilization' | 'chain-completion' | 'hybrid'
}

/**
 * Comprehensive utility for waiting for React Query operations to complete.
 *
 * This handles common testing scenarios:
 * - Simple queries that need to complete
 * - Chained/dependent queries where one query enables another
 * - Navigation that triggers new queries
 * - Mutations that invalidate and refetch queries
 *
 * @example
 * ```typescript
 * // Simple case - wait for current queries to finish
 * await waitForQueries(queryClient)
 *
 * // Complex case - wait for chained queries with debug info
 * await waitForQueries(queryClient, {
 *   strategy: 'chain-completion',
 *   timeout: 30000
 * })
 * ```
 */
export async function waitForQueries(
  queryClient: QueryClient,
  options: WaitForQueriesOptions = {},
): Promise<void> {
  const {
    timeout = 25_000,
    interval = 50,
    stableDuration = 300,
    strategy = 'hybrid',
  } = options

  switch (strategy) {
    case 'stabilization':
      debug('Using stabilization strategy')
      await waitForQueryStabilization(queryClient, {
        timeout,
        interval,
        stableDuration,
      })
      break

    case 'chain-completion':
      debug('Using chain-completion strategy')
      await waitForQueryChainCompletion(queryClient, {
        timeout,
        interval,
        stableDuration,
      })
      break

    case 'hybrid':
    default:
      debug('Using hybrid strategy')
      try {
        // First try the simpler stabilization approach
        await waitForQueryStabilization(queryClient, {
          timeout: Math.min(timeout * 0.6, 8000), // Use 60% of timeout for first attempt
          interval,
          stableDuration: stableDuration * 0.7, // Shorter duration for first attempt
        })
        debug('Stabilization successful')
      } catch (_error: unknown) {
        debug('Stabilization failed, trying chain-completion approach')
        // If that fails, fall back to the more comprehensive approach
        await waitForQueryChainCompletion(queryClient, {
          timeout: timeout * 0.5, // Use remaining timeout
          interval,
          stableDuration,
        })
        debug('Chain-completion successful')
      }
      break
  }
}
