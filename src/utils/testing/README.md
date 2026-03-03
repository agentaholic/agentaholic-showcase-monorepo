# Testing Utilities

## Query Testing

### `waitForQueries`

A comprehensive utility for waiting for React Query operations to complete in tests. This handles complex scenarios like chained queries, navigation-triggered queries, and mutation invalidations.

#### Basic Usage

```typescript
import { waitForQueries } from '~src/utils/testing/waitForQueries'

// Wait for all current queries to complete
await waitForQueries(queryClient)

// Wait with custom timeout
await waitForQueries(queryClient, { timeout: 10000 })
```

#### Strategies

The utility supports three strategies:

1. **`stabilization`** (simple): Waits for queries to be idle for a specified duration
2. **`chain-completion`** (comprehensive): Monitors query cache for new queries and invalidations
3. **`hybrid`** (default): Tries stabilization first, falls back to chain-completion

#### Common Scenarios

##### Navigation with Chained Queries

```typescript
// User clicks a button that navigates and triggers multiple dependent queries
fireEvent.click(screen.getByTestId('navigate-button'))

// Wait for the entire query chain to complete
await waitForQueries(queryClient, {
  strategy: 'chain-completion',
  timeout: 15000,
})
```

##### Custom Configuration

```typescript
await waitForQueries(queryClient, {
  timeout: 20_000, // Max wait time
  interval: 50, // Check interval
  stableDuration: 300, // How long queries must be stable
  strategy: 'hybrid', // Which strategy to use
})
```

#### Migration from Multiple waitFor Calls

**Before:**

```typescript
await waitFor(() => {
  expect(queryClient.isFetching()).toBe(0)
  expect(queryClient.isMutating()).toBe(0)
})

await waitFor(() => {
  expect(queryClient.isFetching()).toBe(0)
  expect(queryClient.isMutating()).toBe(0)
})

await waitFor(() => {
  expect(queryClient.isFetching()).toBe(0)
  expect(queryClient.isMutating()).toBe(0)
})
```

**After:**

```typescript
await waitForQueries(queryClient, {
  strategy: 'chain-completion',
})
```

#### When to Use Each Strategy

- **`stabilization`**: Simple cases where you just need current queries to finish
- **`chain-completion`**: Complex cases with navigation, dependent queries, or mutations that trigger refetches
- **`hybrid`**: When you're unsure - it tries the simple approach first and falls back to comprehensive if needed

#### Error Handling

The utility will throw descriptive errors if queries don't stabilize within the timeout:

```
Query chain completion failed after 100 cycles.
Final state: {"fetching":1,"mutating":0,"enabled":3}
```

This helps debug what queries are still running when tests fail.
