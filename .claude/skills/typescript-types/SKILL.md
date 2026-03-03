---
name: typescript-types
description: ALWAYS use when creating or modifying TypeScript types, aggregates, events, API interfaces, or any data structures. MANDATORY for defining types with entity references (IDs, properties). This skill defines the nested key references principle which MUST be followed throughout the codebase.
---

## When to Use This Skill

**ALWAYS load this skill BEFORE:**

- Creating or modifying aggregate types
- Creating or modifying event types
- Creating or modifying API request/response interfaces
- Adding fields to existing types that reference other entities
- Reviewing or refactoring data structures
- Working with entity identifiers or properties (use `entity.id` NOT `entityId`)

**Key Rule:** Any time you're about to type `entityId`, `entityProperty`, or similar flat naming, load this skill first. You should be using `entity: { id }` instead.

## Encore Type Compatibility

When working with Ethereum addresses or other blockchain-specific types in TypeScript, never use template literal types like `0x${string}` in aggregate schemas or Encore-compatible code. These types are not compatible with Encore's serialization and type system.

**Instead, always use plain `string` type for Ethereum addresses in:**

- Aggregate type definitions
- Event data structures
- API request/response types
- Database schema types

**Examples:**

**Good (Encore-compatible):**

```typescript
interface PaymentAggregate {
  id: string
  recipient: {
    wallet: { address: string } // ✅ Plain string
  }
  creditToken: { address: string } // ✅ Plain string
}

interface TransactionInitiatedEvent {
  data: {
    contract: { address: string } // ✅ Plain string
    recipient: {
      wallet: {
        address: string // ✅ Plain string
      }
    }
  }
}
```

**Bad (Not Encore-compatible):**

```typescript
interface PaymentAggregate {
  id: string
  recipient: {
    wallet: { address: `0x${string}` } // ❌ Not compatible with Encore
  }
  creditToken: { address: `0x${string}` } // ❌ Not compatible with Encore
}
```

**Note:** The `0x${string}` type can still be used in frontend code that doesn't interact with Encore services directly, but should be avoided in all backend service code, aggregates, and event structures.

---

## Nested Key References

When a variable represents a property of an entity, **always structure it as a nested object** rather than a flat string. This pattern improves type safety, code readability, and makes relationships between entities explicit.

### Core Principle

**Instead of:** `entityNameProperty` (flat)
**Use:** `entityName.property` (nested)

This applies to variables, function parameters, type definitions, and API contracts.

### Variables and Parameters

#### Basic Examples

**Good:**

```typescript
const user = { id: 'usr_123' }
const organization = { slug: 'acme-corp' }
const payment = { id: 'pay_456' }
const database = { url: 'postgresql://...' }
```

**Bad:**

```typescript
const userId = 'usr_123'
const organizationSlug = 'acme-corp'
const paymentId = 'pay_456'
const databaseUrl = 'postgresql://...'
```

#### Function Parameters

**Good:**

```typescript
async function assignUserToOrganization(
  user: { id: string },
  organization: { id: string },
) {
  // Implementation
}

async function createPayment(
  merchant: { id: string },
  customer: { id: string },
  amount: { value: number },
) {
  // Implementation
}
```

**Bad:**

```typescript
async function assignUserToOrganization(
  userId: string,
  organizationId: string,
) {
  // Implementation
}

async function createPayment(
  merchantId: string,
  customerId: string,
  amountValue: number,
) {
  // Implementation
}
```

#### Function Return Values

**Good:**

```typescript
async function loadUserContext() {
  return {
    user: { id: 'usr_123' },
    organization: { id: 'org_456', slug: 'acme' },
    session: { token: 'sess_789' },
  }
}
```

**Bad:**

```typescript
async function loadUserContext() {
  return {
    userId: 'usr_123',
    organizationId: 'org_456',
    organizationSlug: 'acme',
    sessionToken: 'sess_789',
  }
}
```

### TypeScript Type Definitions

#### Aggregate Types

**Good:**

```typescript
interface UserAggregate {
  id: string
  email: string
  profile?: { id: string }
  organization?: { id: string }
  subscription?: { id: string }
}

interface PaymentAggregate {
  id: string
  merchant: { id: string }
  customer: { id: string }
  stripePaymentIntent?: { id: string }
  amount: { value: number }
  currency: { code: string }
}
```

**Bad:**

```typescript
interface UserAggregate {
  id: string
  email: string
  profileId?: string
  organizationId?: string
  subscriptionId?: string
}

interface PaymentAggregate {
  id: string
  merchantId: string
  customerId: string
  stripePaymentIntentId?: string
  amountValue: number
  currencyCode: string
}
```

#### Event Data Structures

**Good:**

```typescript
interface PaymentVerificationAssignedEvent {
  name: 'PaymentVerificationAssigned'
  aggregate: {
    name: 'PaymentVerification'
    id: string
  }
  data: {
    paymentVerification: { id: string }
    user: { id: string }
    assignedBy: { id: string }
  }
}

interface OrderCreatedEvent {
  name: 'OrderCreated'
  aggregate: {
    name: 'Order'
    id: string
  }
  data: {
    customer: { id: string }
    merchant: { id: string }
    payment: { id: string }
  }
}
```

**Bad:**

```typescript
interface PaymentVerificationAssignedEvent {
  name: 'PaymentVerificationAssigned'
  aggregateName: 'PaymentVerification'
  aggregateId: string
  data: {
    paymentVerificationId: string
    userId: string
    assignedById: string
  }
}

interface OrderCreatedEvent {
  name: 'OrderCreated'
  aggregateName: 'Order'
  aggregateId: string
  data: {
    customerId: string
    merchantId: string
    paymentId: string
  }
}
```

#### API Request/Response Types

**Good:**

```typescript
interface CreatePaymentRequest {
  merchant: { id: string }
  customer: { id: string }
  amount: { value: number }
  currency: { code: string }
  creditToken?: { address: string }
}

interface CreatePaymentResponse {
  payment: { id: string }
}

interface AssignVerificationRequest {
  paymentVerification: { id: string }
  user: { id: string }
}
```

**Bad:**

```typescript
interface CreatePaymentRequest {
  merchantId: string
  customerId: string
  amountValue: number
  currencyCode: string
  creditTokenAddress?: string
}

interface CreatePaymentResponse {
  paymentId: string
}

interface AssignVerificationRequest {
  paymentVerificationId: string
  userId: string
}
```

### Real-World Usage Examples

#### Creating Events

**Good:**

```typescript
const event: PaymentCreatedEvent = {
  name: 'PaymentCreated',
  id: generateId({ mode: 'random' }),
  aggregate: {
    name: 'Payment',
    id: payment.id,
    service: { name: 'payments' },
  },
  data: {
    merchant: { id: merchantId },
    customer: { id: customerId },
    amount: { value: 100 },
    currency: { code: 'USD' },
  },
}
```

**Bad:**

```typescript
const event: PaymentCreatedEvent = {
  name: 'PaymentCreated',
  eventId: generateId({ mode: 'random' }),
  aggregateName: 'Payment',
  aggregateId: paymentId,
  serviceName: 'payments',
  data: {
    merchantId: merchantId,
    customerId: customerId,
    amountValue: 100,
    currencyCode: 'USD',
  },
}
```

#### API Endpoint Implementation

**Good:**

```typescript
export const createPayment = api(
  { expose: true, method: 'POST' },
  async (params: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    const paymentId = generateId({ mode: 'random' })

    const event: PaymentCreatedEvent = {
      name: 'PaymentCreated',
      id: generateId({ mode: 'random' }),
      aggregate: {
        name: 'Payment',
        id: paymentId,
        service: { name: 'payments' },
      },
      data: {
        merchant: params.merchant,
        customer: params.customer,
        amount: params.amount,
        currency: params.currency,
      },
    }

    await events.commitTransaction({ events: [event] })

    return { payment: { id: paymentId } }
  },
)
```

**Bad:**

```typescript
export const createPayment = api(
  { expose: true, method: 'POST' },
  async (params: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    const paymentId = generateId({ mode: 'random' })

    const event: PaymentCreatedEvent = {
      name: 'PaymentCreated',
      eventId: generateId({ mode: 'random' }),
      aggregateId: paymentId,
      aggregateName: 'Payment',
      serviceName: 'payments',
      data: {
        merchantId: params.merchantId,
        customerId: params.customerId,
        amountValue: params.amountValue,
        currencyCode: params.currencyCode,
      },
    }

    await events.commitTransaction({ events: [event] })

    return { paymentId }
  },
)
```

### Exceptions

#### Database Columns

When defining database schemas, you often cannot store nested objects:

**Acceptable:**

```typescript
interface PaymentRow {
  id: string
  merchantId: string // ✓ Database column - flat is OK
  customerId: string // ✓ Database column - flat is OK
  amountValue: number // ✓ Database column - flat is OK
  currencyCode: string // ✓ Database column - flat is OK
}
```

**But when querying, transform to nested:**

```typescript
async function getPayment(id: string) {
  const row = await db.query('SELECT * FROM payments WHERE id = $1', [id])

  return {
    id: row.id,
    merchant: { id: row.merchantId }, // ✓ Transform to nested
    customer: { id: row.customerId }, // ✓ Transform to nested
    amount: { value: row.amountValue }, // ✓ Transform to nested
    currency: { code: row.currencyCode }, // ✓ Transform to nested
  }
}
```

#### External System Entities vs Configuration Values

Even when working with external systems, **still use nested key references for entities**:

**Correct (external system entities):**

```typescript
const stripeCustomer = { id: 'cus_abc123' } // ✓ Stripe customer entity
const stripePaymentIntent = { id: 'pi_xyz789' } // ✓ Stripe payment intent entity
const githubUser = { id: '12345' } // ✓ GitHub user entity
const awsBucket = { name: 'my-bucket' } // ✓ AWS S3 bucket entity
```

**Correct (configuration values and tokens - NOT entities):**

```typescript
const githubAccessToken = 'ghp_token' // ✓ Token/credential
const postgresScheme = 'postgresql' // ✓ Configuration value
const awsRegion = 'us-east-1' // ✓ Configuration value
const stripeApiKey = 'sk_test_...' // ✓ API credential
```

**Why the difference?**

- **Entities** (Stripe customer, GitHub user) represent "things" with properties → Use nested objects
- **Credentials and configuration** (API keys, tokens, regions) are scalar values → Use flat variables

**Incorrect:**

```typescript
// ❌ These ARE entities, even if from external systems
const stripeCustomerId = 'cus_abc123' // Should be: stripeCustomer.id
const stripePaymentIntentId = 'pi_xyz789' // Should be: stripePaymentIntent.id

// ❌ These are our domain entities
const paymentId = 'pay_123' // Should be: payment.id
const userId = 'usr_456' // Should be: user.id
const organizationSlug = 'acme' // Should be: organization.slug
```

### Benefits

1. **Type Safety**: Nested objects make relationships explicit in the type system
2. **Readability**: `user.id` is clearer than `userId` when multiple entities are involved
3. **Refactoring**: Easier to add properties without renaming variables (e.g., adding `user.email` doesn't require creating `userEmail`)
4. **Consistency**: Uniform pattern across aggregates, events, and API contracts
5. **Documentation**: The structure self-documents entity relationships
