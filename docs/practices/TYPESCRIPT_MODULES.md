## TypeScript Modules

When writing TypeScript modules, aim to export one main thing per file. The file name should match the name of the export.

### File Naming Must Match Export Names

**File names should exactly match their primary export** (not camelCase when export is TitleCase):

**Good:**

```typescript
// BaseDomainEvent.ts (matches export name exactly)
export class BaseDomainEvent {}

// generateId.ts (matches export name exactly)
export const generateId = () => {}

// UserAggregate.ts (matches export name exactly)
export interface UserAggregate {}
```

**Bad:**

```typescript
// baseDomainEvent.ts (doesn't match TitleCase export)
export class BaseDomainEvent {}

// generate-id.ts (doesn't match camelCase export)
export const generateId = () => {}

// user-aggregate.ts (doesn't match TitleCase export)
export interface UserAggregate {}
```

### One File Per Export

**In Encore services:**

- One file per endpoint in the `api/` folder
- One file per aggregate in the `aggregates/` folder
- One file per utility function in the `utils/` folder

**Good:**

```
api/
├── createPayment.ts        # exports createPayment endpoint
├── getPayment.ts           # exports getPayment endpoint
└── listPayments.ts         # exports listPayments endpoint
```

**Bad:**

```
api/
└── payments.ts             # exports multiple endpoints
```

### Exception: Co-located Types

**You may export additional types from the same file when they are:**

- Specific to the primary export
- Not reusable elsewhere
- Would create clutter if separated

**Good:**

```typescript
// createPayment.ts
export interface CreatePaymentRequest {
  amount: { value: number }
  currency: { code: string }
}

export interface CreatePaymentResponse {
  payment: { id: string }
}

export const createPayment = api(
  { expose: true, method: 'POST' },
  async (params: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    // implementation
  },
)
```

**Bad:**

```typescript
// types/CreatePaymentRequest.ts - creates unnecessary file separation
export interface CreatePaymentRequest {}

// types/CreatePaymentResponse.ts - creates unnecessary file separation
export interface CreatePaymentResponse {}

// api/createPayment.ts
import type { CreatePaymentRequest } from '../types/CreatePaymentRequest'
import type { CreatePaymentResponse } from '../types/CreatePaymentResponse'
```

### Avoid Barrel Files

Do not create barrel files (index.ts or index.js files that re-export modules from other files). Instead, import directly from the source file where the export is defined.

Barrel files create several problems:

- They can cause circular dependency issues
- They negatively impact tree-shaking and increase bundle sizes
- They make it harder to trace where exports come from
- They slow down build performance due to unnecessary module resolution
- They complicate refactoring and code navigation

Examples:

**Bad:**

```typescript
// utils/index.ts (barrel file)
export { generateId } from './generateId'
export { convertId } from './convertId'

// consumer.ts
import { generateId, convertId } from '~src/utils' // Bad - using barrel file
```

**Good:**

```typescript
// consumer.ts
import { generateId } from '~src/utils/generateId' // Good - direct import
import { convertId } from '~src/utils/convertId' // Good - direct import
```

Each module should be imported directly from its source file, making the codebase more maintainable and performant.
