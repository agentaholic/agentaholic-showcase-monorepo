---
name: eslint-rules
description: Always use this skill when creating TypeScript files, modifying TypeScript files, fixing ESLint errors, discussing code style, linting issues, or type safety.
---

## ESLint Compliance

All code must comply with the project's ESLint rules as defined in `eslint.config.js`. This project uses `typescript-eslint` strict type checking mode, which enforces rigorous type safety.

### Core Principle

**Write type-safe code that passes strict ESLint checks without requiring disable comments or workarounds.**

### Key ESLint Rules

This project uses `typescript-eslint` strict type checking with the following custom rules:

1. **No explicit `any` types** (`@typescript-eslint/no-explicit-any`)
2. **No unused variables** (`@typescript-eslint/no-unused-vars`)
3. **Exhaustive switch statements** (`@typescript-eslint/switch-exhaustiveness-check`)
4. **Unknown in catch variables** (`@typescript-eslint/use-unknown-in-catch-callback-variable`)
5. **Restricted template expressions** (`@typescript-eslint/restrict-template-expressions`)
6. **No relative imports** (`no-relative-import-paths/no-relative-import-paths`)

---

## Rule 1: No Explicit `any`

Never use the `any` type. Use proper TypeScript types or `unknown` for truly dynamic values.

**Good (proper typing):**

```typescript
interface PaymentData {
  amount: { value: number }
  currency: { code: string }
}

function processPayment(data: PaymentData) {
  return data.amount.value
}

// For truly unknown types, use 'unknown'
function handleError(error: unknown) {
  if (error instanceof Error) {
    console.error(error.message)
  }
}

// Use generics for flexible typing
function identity<T>(value: T): T {
  return value
}
```

**Bad (using `any`):**

```typescript
// ❌ ESLint error: no-explicit-any
function processPayment(data: any) {
  return data.amount.value
}

// ❌ ESLint error: no-explicit-any
function handleError(error: any) {
  console.error(error.message)
}

// ❌ ESLint error: no-explicit-any
const config: any = { timeout: 5000 }
```

---

## Rule 2: No Unused Variables

All declared variables, parameters, and imports must be used. Prefix with underscore (`_`) if intentionally unused.

**Good (all variables used):**

```typescript
function calculateTotal(items: Array<{ price: number }>) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Destructuring with used values
const { id, name } = user
debug(id, name)
```

**Good (intentionally unused, prefixed with underscore):**

```typescript
// Unused parameter in callback
items.map((_item, index) => index)

// Unused catch error
try {
  await fetch(url)
} catch (_error) {
  return null
}

// Unused destructured values
const { id, name: _name, ...rest } = user
return { id, ...rest }

// Unused function parameter (implementing interface)
interface Handler {
  handle(event: Event, context: Context): void
}

class MyHandler implements Handler {
  handle(_event: Event, _context: Context): void {
    // Implementation doesn't need these parameters
  }
}
```

**Bad (unused without underscore prefix):**

```typescript
// ❌ ESLint error: 'total' is defined but never used
function calculatePrice() {
  const total = 100
  return 50
}

// ❌ ESLint error: 'item' is defined but never used
items.map((item, index) => index)

// ❌ ESLint error: 'error' is defined but never used
try {
  await fetch(url)
} catch (error) {
  return null
}
```

---

## Rule 3: Exhaustive Switch Statements

Switch statements on union types must handle all possible cases or have a default case.

**Good (all cases handled):**

```typescript
type EventName = 'PaymentCreated' | 'PaymentCompleted' | 'PaymentFailed'

function handleEvent(eventName: EventName) {
  switch (eventName) {
    case 'PaymentCreated':
      return 'created'
    case 'PaymentCompleted':
      return 'completed'
    case 'PaymentFailed':
      return 'failed'
  }
}
```

**Good (with default case):**

```typescript
type EventName = 'PaymentCreated' | 'PaymentCompleted' | 'PaymentFailed'

function handleEvent(eventName: EventName) {
  switch (eventName) {
    case 'PaymentCreated':
      return 'created'
    default:
      return 'unknown'
  }
  // ✓ Default case makes switch exhaustive
}
```

**Good (with exhaustiveness check helper):**

```typescript
type EventName = 'PaymentCreated' | 'PaymentCompleted' | 'PaymentFailed'

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`)
}

function handleEvent(eventName: EventName) {
  switch (eventName) {
    case 'PaymentCreated':
      return 'created'
    case 'PaymentCompleted':
      return 'completed'
    case 'PaymentFailed':
      return 'failed'
    default:
      return assertNever(eventName) // Type error if we miss a case
  }
}
```

**Bad (missing cases without default):**

```typescript
type EventName = 'PaymentCreated' | 'PaymentCompleted' | 'PaymentFailed'

// ❌ ESLint error: Switch is not exhaustive
function handleEvent(eventName: EventName) {
  switch (eventName) {
    case 'PaymentCreated':
      return 'created'
    case 'PaymentCompleted':
      return 'completed'
    // Missing 'PaymentFailed' case and no default
  }
}
```

---

## Rule 4: Unknown in Catch Variables

Use `unknown` type for catch variables instead of relying on implicit `any`.

**Good (proper error handling with unknown):**

```typescript
try {
  await someOperation()
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error('Operation failed:', error.message)
  } else {
    console.error('Unknown error:', error)
  }
}

// In callbacks
promise.catch((error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unknown error'
})
```

**Bad (implicit or explicit any):**

```typescript
// ❌ ESLint error: use-unknown-in-catch-callback-variable
promise.catch((error) => {
  // error is implicitly 'any'
  console.error(error.message)
})

// ❌ ESLint error: use-unknown-in-catch-callback-variable
promise.catch((error: any) => {
  console.error(error.message)
})
```

---

## Rule 5: Restricted Template Expressions

Only numbers and booleans are allowed in template literals. Strings, nullish values, and other types must be explicitly handled.

**Good (allowed types in templates):**

```typescript
const count = 42
const isActive = true

debug(`Count: ${count}`) // ✓ Number allowed
debug(`Active: ${isActive}`) // ✓ Boolean allowed
debug(`Fixed text`) // ✓ No interpolation
```

**Good (handling other types explicitly):**

```typescript
const name: string | null = getName()

// ✓ Explicitly handle nullish values
debug(`Name: ${name ?? 'unknown'}`)

const error: Error | undefined = getError()

// ✓ Use optional chaining and nullish coalescing
debug(`Error: ${error?.message ?? 'none'}`)
```

**Bad (restricted types in templates):**

```typescript
const name: string | null = getName()

// ❌ ESLint error: Nullish type not allowed in template
debug(`Name: ${name}`)

// ❌ ESLint error: Nullish value not allowed
const value: number | null = 42
debug(`Value: ${value}`)

// ❌ ESLint error: Object not allowed in template
const user = { name: 'Alice' }
debug(`User: ${user}`)
```

---

## Rule 6: No Relative Import Paths

Always use absolute imports with the `~src` alias. Never use relative paths like `../` or `./`.

**Good (absolute imports):**

```typescript
import { generateId } from '~src/utils/id/generateId'
import { events } from '~encore/clients'
import type { PaymentAggregate } from '~src/services/payments/aggregates/Payment/PaymentAggregate'
import { apiClient } from '~src/utils/api/apiClient'
```

**Bad (relative imports):**

```typescript
// ❌ ESLint error: no-relative-import-paths
import { generateId } from '../../../utils/id/generateId'

// ❌ ESLint error: no-relative-import-paths
import { PaymentAggregate } from '../aggregates/Payment/PaymentAggregate'

// ❌ ESLint error: no-relative-import-paths
import { apiClient } from './apiClient'
```

**Exception (same folder imports):**

This rule is configured with `allowSameFolder: false`, so even imports from the same directory must use absolute paths:

```typescript
// ❌ Even in the same folder
import { helper } from './helper'

// ✓ Use absolute path
import { helper } from '~src/services/payments/utils/helper'
```

---

## Additional Strict Type Checking Rules

The project uses `strictTypeChecked` mode, which includes many additional rules:

### No Unsafe Member Access

**Good:**

```typescript
function processData(data: { value?: number }) {
  if (data.value !== undefined) {
    return data.value * 2 // ✓ Checked for undefined first
  }
}
```

**Bad:**

```typescript
// ❌ ESLint error: Unsafe member access
function processData(data: { value?: number }) {
  return data.value * 2 // value might be undefined
}
```

### No Unsafe Assignment

**Good:**

```typescript
let value: number = 42

const numberValue: number = value // ✓ Type-safe assignment
```

**Bad:**

```typescript
// ❌ ESLint error: Unsafe assignment
let value: unknown = 42
const numberValue: number = value // unknown is not assignable to number
```

### No Floating Promises

**Good:**

```typescript
// ✓ Await the promise
await saveToDatabase(data)

// ✓ Handle the promise
void saveToDatabase(data)

// ✓ Return the promise
return saveToDatabase(data)
```

**Bad:**

```typescript
// ❌ ESLint error: Floating promise
saveToDatabase(data) // Promise not handled
```

---

## Running ESLint

Use this command to check for ESLint errors:

```bash
npm run lint
```

Use this command to automatically fix ESLint errors:

```bash
npm run lint:fix
```

---

## Summary

**Key rules to remember:**

1. **Never use `any`** - Use proper types or `unknown`
2. **Prefix unused variables with `_`** - `_error`, `_event`, `_item`
3. **Make switches exhaustive** - Handle all cases or add default
4. **Use `unknown` in catch** - `catch (error: unknown)`
5. **Be careful with templates** - Only numbers and booleans allowed directly
6. **Use absolute imports** - Always `~src/...`, never `../...`

**When writing code:**

- Think about types first
- Handle all edge cases
- Be explicit about what values can be
- Use type guards for narrowing (`instanceof`, `typeof`, etc.)

**Benefits:**

- Catch bugs at compile time instead of runtime
- Better IDE autocomplete and refactoring
- Self-documenting code through types
- Easier to maintain and understand code
