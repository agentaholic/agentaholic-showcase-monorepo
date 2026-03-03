---
name: frontend-api
description: Use when integrating backend APIs with frontend, using React Query, or working with the API client.
---

## Frontend API Integration

When integrating Encore backend services with the React frontend, follow these specific patterns to ensure proper separation of concerns and type safety.

### Frontend API Client Usage

**Always use the generated API client for frontend code**, not the Encore service clients directly:

**Good (Frontend):**

```typescript
// In React components or frontend utilities
import { apiClient } from '~src/utils/api/apiClient'

const handleCreatePayment = async () => {
  const response = await apiClient.payments.createPayment({
    amount: { value: 100 },
    currency: { code: 'USD' },
  })
}
```

**Bad (Frontend):**

```typescript
// DON'T do this in frontend code
import { payments } from '~encore/clients'

const handleCreatePayment = async () => {
  // This won't work in the browser
  const response = await payments.createPayment({
    amount: { value: 100 },
    currency: { code: 'USD' },
  })
}
```

**Good (Backend Services):**

```typescript
// In Encore service endpoints
import { payments } from '~encore/clients'

export const processOrder = api(
  { expose: false },
  async (params: ProcessOrderRequest) => {
    // This is correct for service-to-service communication
    const payment = await payments.createPayment({
      amount: params.amount,
      currency: params.currency,
    })
  },
)
```

### Endpoint Exposure Requirements

For endpoints to be accessible from the frontend, they **must** use `expose: true`:

**Required for Frontend Access:**

```typescript
export const createPaymentVerification = api(
  { expose: true, method: 'POST', path: '/payment-verifications' },
  async (params: CreatePaymentVerificationRequest) => {
    // Frontend can call this endpoint via apiClient
  },
)
```

**Internal Service Communication Only:**

```typescript
export const getPayment = api(
  { expose: false, method: 'GET', path: '/payment-verifications/payments/:id' },
  async (params: GetPaymentRequest) => {
    // Only other Encore services can call this
  },
)
```

### Updating the Generated API Client

Whenever you add, modify, or remove public endpoints (`expose: true`), run the update script:

```bash
./bin/updateGeneratedApiClient.sh
```

This script regenerates `src/utils/api/generated/ApiClient.ts` with the latest type definitions and endpoint signatures from your Encore services.

**Troubleshooting:** When services have been deleted, Encore may not correctly handle the cleanup, causing errors like "Cannot find module <module_path> or its corresponding type declarations" from within `encore.gen`. To fix this, remove the `encore.gen` directory and re-run the script:

```bash
rm -r encore.gen
./bin/updateGeneratedApiClient.sh
```

### React Query Integration

**Always use React Query hooks for data fetching in the frontend** to leverage caching, automatic refetching, loading states, and error handling.

**Create custom hooks for each API endpoint:**

```typescript
// src/services/{serviceName}/hooks/use{EntityName}.ts
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '~src/utils/api/apiClient'
import type { Get{EntityName}Response } from '~src/services/{serviceName}/api/get{EntityName}'

export const use{EntityName} = ({ id }: { id: string }) => {
  return useQuery<Get{EntityName}Response>({
    queryKey: ['{entityName}', id],
    queryFn: async () => {
      const response = await apiClient.{serviceName}.get{EntityName}({ id })
      return response
    },
    enabled: !!id
  })
}
```

**Use mutations for write operations:**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '~src/utils/api/apiClient'

export const useCreate{EntityName} = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Create{EntityName}Request) => {
      return await apiClient.{serviceName}.create{EntityName}(data)
    },
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['{entityName}'] })
    },
  })
}
```

**In React components, always use these hooks:**

```typescript
const MyComponent = () => {
  const { data, isLoading, isError, error } = use{EntityName}({ id })
  const createMutation = useCreate{EntityName}()

  // Handle loading, error, and success states using React Query's built-in states
  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {error.message}</div>

  return <div>{data?.aggregate.name}</div>
}
```

### Architecture Summary

- **Frontend ↔ Backend**: Use `apiClient` within React Query hooks for HTTP requests to public endpoints
- **Backend ↔ Backend**: Use `~encore/clients` for direct service-to-service calls
- **Public endpoints**: Must use `expose: true` to be accessible from frontend
- **Private endpoints**: Use `expose: false` for internal service communication only
- **Data fetching**: Always use React Query hooks, never call `apiClient` directly in components
