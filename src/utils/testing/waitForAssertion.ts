/* v8 ignore start */

/**
 * Utility for waiting for async assertions to pass in tests.
 * Useful for testing event handlers, subscriptions, or other async operations.
 */
export async function waitForAssertion(
  assertion: () => void | Promise<void>,
  options: {
    timeout?: number
    interval?: number
  } = {},
): Promise<void> {
  const { timeout = 5000, interval = 50 } = options

  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    try {
      await assertion()
      return // Success - assertion passed
    } catch (_error: unknown) {
      // Wait for the interval before trying again
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }

  // Final attempt - let the error bubble up if it still fails
  await assertion()
}
