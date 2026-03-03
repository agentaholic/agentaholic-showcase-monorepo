---
name: error-handling
description: 'ALWAYS use when: (1) writing or reviewing try-catch blocks, (2) seeing empty catch blocks or catch blocks that only log/re-throw, (3) noticing untested catch blocks causing coverage gaps, or (4) implementing error recovery. This skill enforces avoiding defensive programming - most try-catch blocks are unnecessary and should be removed.'
---

## Avoid Overly-Defensive Programming

Only use try-catch blocks when they add meaningful value through error recovery, transformation, or context.

### When NOT to Use Try-Catch

**Bad (pointless try-catch that just re-throws):**

```typescript
export const createPayment = api(
  { expose: true, method: 'POST' },
  async (params: CreatePaymentRequest) => {
    try {
      const paymentId = generateId({ mode: 'random' })
      await events.commitTransaction({ events: [...] })
      return { payment: { id: paymentId } }
    } catch (error) {
      debug('Error creating payment:', error)
      throw error // ❌ Just re-throwing without adding value
    }
  }
)
```

**Good (let errors bubble up naturally):**

```typescript
export const createPayment = api(
  { expose: true, method: 'POST' },
  async (params: CreatePaymentRequest) => {
    const paymentId = generateId({ mode: 'random' })
    await events.commitTransaction({ events: [...] })
    return { payment: { id: paymentId } }
    // ✓ Encore will handle logging and error responses
  }
)
```

**Bad (wrapping without value):**

```typescript
async function loadUserData(userId: string) {
  try {
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId])
    return user
  } catch (error) {
    throw new Error(`Failed to load user: ${error.message}`) // ❌ Generic wrapper
  }
}
```

**Good (no try-catch needed):**

```typescript
async function loadUserData(userId: string) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [userId])
  return user
  // ✓ Let database errors propagate with full context
}
```

### When to Use Try-Catch

Only use try-catch when you can provide **meaningful error handling**:

#### 1. Error Recovery Logic

**Good (retry logic):**

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url)
    } catch (error) {
      if (attempt === maxRetries) throw error
      await sleep(1000 * attempt)
    }
  }
}
```

**Good (fallback behavior):**

```typescript
async function getUserPreferences(userId: string) {
  try {
    return await db.query('SELECT * FROM preferences WHERE user_id = $1', [
      userId,
    ])
  } catch (error) {
    // ✓ Return sensible defaults when preferences don't exist
    return { theme: 'light', notifications: true }
  }
}
```

#### 2. Transform to More Appropriate Error Types

**Good (domain-specific errors):**

```typescript
async function processPayment(payment: { id: string }) {
  try {
    const stripePaymentIntent = await stripe.paymentIntents.create({...})
    return stripePaymentIntent
  } catch (error) {
    // ✓ Transform Stripe errors to domain errors
    if (error instanceof Stripe.errors.StripeCardError) {
      throw new PaymentDeclinedError(error.message, error.decline_code)
    }
    throw error
  }
}
```

#### 3. Add Significant Contextual Information

**Good (enriching error context):**

```typescript
async function assignVerification(
  paymentVerification: { id: string },
  user: { id: string }
) {
  try {
    await events.commitTransaction({ events: [...] })
  } catch (error) {
    // ✓ Add context that wouldn't be in the stack trace
    throw new Error(
      `Failed to assign verification ${paymentVerification.id} to user ${user.id}: ${error.message}`,
      { cause: error }
    )
  }
}
```

#### 4. Handle Specific Error Conditions Differently

**Good (conditional error handling):**

```typescript
async function createUser(email: string) {
  try {
    const userId = generateId({ mode: 'random' })
    await db.query('INSERT INTO users (id, email) VALUES ($1, $2)', [
      userId,
      email,
    ])
    return { user: { id: userId } }
  } catch (error) {
    // ✓ Handle duplicate email specifically
    if (error.code === '23505') {
      // PostgreSQL unique violation
      throw new UserAlreadyExistsError(email)
    }
    throw error
  }
}
```

### Summary

**Don't use try-catch for:**

- Logging errors (framework handles this)
- Re-throwing without transformation
- Generic error wrapping

**Do use try-catch for:**

- Retry logic or fallback behavior
- Transforming to domain-specific errors
- Adding business context
- Handling specific error conditions differently
