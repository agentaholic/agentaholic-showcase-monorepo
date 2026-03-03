---
name: eventual-consistency-saga
description: Use when implementing saga-like multi-step operations, chaining sequential operations with eventual consistency, working with racing patterns where caller and background job both invoke next steps, designing idempotent endpoints with database locks, implementing transactional outbox for background jobs, coordinating multi-step processes that can fail and retry, or working with pub/sub topics needing guaranteed delivery.
---

# Eventual Consistency Saga Pattern

This skill explains how to implement saga-like multi-step operations using the **eventual consistency racing pattern** in the agentaholic showcase codebase.

## Overview

The eventual consistency saga pattern solves a critical problem: **How do you reliably chain multi-step operations where each step can fail, while providing immediate responses to callers?**

### The Pattern

1. **First Step**: Service endpoint returns an ID and atomically publishes to transactional outbox
2. **Racing Execution**: Both the caller AND a background job invoke the "next step" endpoint
3. **Idempotent Processing**: The next step uses advisory locks to ensure only one invocation proceeds
4. **Eventual Consistency**: Doesn't matter who wins the race - work completes either way

### Benefits

- **Optimistic Execution**: Caller gets immediate response (fast path if it wins the race)
- **Guaranteed Completion**: Background job ensures work finishes even if caller fails
- **Self-Healing**: System recovers from transient failures automatically
- **No Coordination**: Caller and background job operate independently
- **Audit Trail**: Events document complete saga execution history

### Built On

This pattern combines:

- **Transactional Outbox**: Atomic event + message publishing with PostgreSQL LISTEN/NOTIFY
- **Advisory Locks**: Database-level coordination for idempotency (`pg_advisory_xact_lock`)
- **At-Least-Once Delivery**: Encore pub/sub guarantee + automatic retry on failure
- **Event Sourcing**: Complete audit trail of saga execution

## When to Use This Pattern

### ✓ Use For

| Scenario                                        | Why This Pattern Fits                                             |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Multi-step saga across services                 | Caller proceeds optimistically, background job ensures completion |
| External system coordination (blockchain, APIs) | Caller attempts immediately, background job retries on failure    |
| Long-running operations with user feedback      | Return quickly to user, complete in background                    |
| Operations with multiple failure points         | Each step independently retryable                                 |
| Processes requiring guaranteed completion       | Background job provides safety net                                |

### ✗ Don't Use For

| Scenario                            | Better Alternative                               |
| ----------------------------------- | ------------------------------------------------ |
| Simple synchronous database insert  | Direct `commitTransaction()` without outbox      |
| Operations where caller MUST wait   | Synchronous call without racing                  |
| Single-step operations              | Standard Encore API endpoint                     |
| Operations that can't be idempotent | Design for idempotency first, then apply pattern |

### Decision Flow

```
Is this a multi-step operation?
├─ No → Don't use this pattern
└─ Yes → Does the caller need immediate response?
    ├─ No → Consider synchronous approach
    └─ Yes → Can the next step be safely retried?
        ├─ No → Design for idempotency first
        └─ Yes → Use eventual consistency saga pattern ✓
            ├─ Step 1: Return ID from endpoint + publish to outbox
            ├─ Step 2: Caller invokes next step with ID
            ├─ Step 3: Background job also invokes next step
            └─ Step 4: Lock + idempotency ensures one wins
```

## Core Concepts

### 1. The Racing Pattern

**Key Idea**: Both caller and background job invoke the same "next step" endpoint - it doesn't matter who wins.

```
Caller Path:           Background Job Path:
  │                         │
  ├─ createEntity()         │
  │  └─ returns ID          │
  │     └─ publishes ───────┼────> Subscription Handler
  │        to outbox        │         │
  │                         │         │
  ├─ processEntity(ID) ────>│<──── processEntity(ID)
  │                         │
  └─ RACE TO ACQUIRE LOCK ──┤
                            │
            First to lock ──┼─> Does the work
            Second arrival ─┼─> Returns cached result
```

**Why Racing is Safe:**

- Advisory lock ensures only one invocation proceeds
- Idempotency check returns cached result for second invocation
- Both paths lead to same outcome: work completes

### 2. Idempotency via Advisory Locks

**Pattern**: Lock on `namespace:operation:entityId` ensures single execution

```typescript
await using tx = await eventsDatabase.begin()

// Lock scope: namespace:operation:entityId
await tx.exec`SELECT pg_advisory_xact_lock(
  hashtext(${namespace.slug} || ':process-entity:' || ${id})
)`

// Check for existing result (idempotency)
const existing = await loadEntityAggregate({ id, namespace })
if (existing?.status === 'processed') {
  return { result: existing.result } // ← Second invocation returns this
}

// First invocation: do the actual work
const result = await performExpensiveOperation(id)
await events.commitTransaction({ events: [...], namespace })
```

**Lock Properties:**

- Scoped to transaction (`pg_advisory_xact_lock` not `pg_advisory_lock`)
- Automatically released on transaction commit/rollback
- Uses `hashtext()` to convert string to integer for PostgreSQL
- Blocks second invocation until first completes

### 3. Eventual Consistency Guarantees

**Three Possible Outcomes** - All lead to completion:

**Scenario A: Caller Wins Race**

1. Caller invokes next step immediately
2. Acquires lock, performs work, commits
3. Background job arrives, finds existing result
4. ✓ Work completed by caller

**Scenario B: Background Job Wins Race**

1. Caller encounters transient error (network, timeout)
2. Background job invokes next step via subscription
3. Acquires lock, performs work, commits
4. ✓ Work completed by background job, system self-heals

**Scenario C: Both Fail Initially**

1. First invocations fail (external system down)
2. Subscription handler throws → message stays unprocessed
3. Relayer retries background job automatically
4. ✓ System eventually reaches consistent state

**Key Properties:**

- **No Lost Work**: Background job guarantees completion
- **No Coordination**: Caller and background job don't communicate
- **Fast Path**: Caller gets immediate result if it wins
- **Self-Healing**: Automatic recovery from transient failures

### 4. Transactional Outbox Foundation

The saga pattern builds on transactional outbox for reliable message delivery:

**Atomicity**: Events + outbox messages committed in single transaction

```typescript
await events.commitTransaction({
  events: [entityCreatedEvent],
  namespace,
  outboxMessages: [createEntityCreatedOutboxMessage({ ... })]
  // ↑ All-or-nothing: commit succeeds or entire transaction rolls back
})
```

**At-Least-Once Delivery**: Encore's guarantee + `processed_at` tracking

- Message persisted before publishing
- Failed subscriptions don't mark as processed
- Relayer retries unprocessed messages

**Real-Time Processing**: PostgreSQL LISTEN/NOTIFY

- No polling required
- Immediate notification when messages inserted
- Startup sweep catches messages missed during downtime

### 5. Saga Orchestration Benefits

**Independent Retryability**: Each step can fail and retry independently

```
Step 1: Create Entity ──> Step 2: Process Entity ──> Step 3: Deploy Contract
  ✓ Succeeds             ✗ Fails (retries)           ⏸ Waiting
```

**Partial Failure Recovery**: No lost work from mid-saga failures

```
If Step 2 fails:
  ✓ Step 1 events already committed (not lost)
  🔄 Step 2 retries via background job
  ⏸ Step 3 waits for Step 2 completion
```

**Clear Audit Trail**: Events document full saga execution

```sql
SELECT * FROM events WHERE aggregate_id = 'entity-123'
-- Shows: EntityCreated, EntityProcessingStarted, EntityProcessed
-- Can see which step initiated each event (caller vs background job)
```

## Architecture Components

### 1. Database Infrastructure

**Outbox Table** (`src/services/events/database/migrations/002_create_outbox_table.up.sql`):

```sql
CREATE TABLE outbox (
    id BIGSERIAL PRIMARY KEY,
    topic_name VARCHAR(255) NOT NULL,
    message_data JSONB NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,  -- Links to events
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE NULL  -- NULL = unprocessed
);

CREATE INDEX idx_outbox_unprocessed ON outbox (id) WHERE processed_at IS NULL;
```

**Sweep Function**: Atomic sweep + notify for startup reliability

```sql
CREATE OR REPLACE FUNCTION sweep_and_notify_outbox() RETURNS void AS $$
-- Loops through unprocessed messages and sends NOTIFY commands
$$;
```

### 2. commitTransaction API

**File**: `src/services/events/api/commitTransaction.ts`

**Key Feature**: Atomic insertion of events + outbox messages + NOTIFY within single transaction

```typescript
await using tx = await eventsDatabase.begin()

// Insert events
for (const event of events) {
  await tx.queryRow`INSERT INTO events (...) VALUES (...)`
}

// Insert outbox messages
for (const outboxMessage of outboxMessages) {
  const result = await tx.queryRow`
    INSERT INTO outbox (topic_name, message_data, transaction_id)
    VALUES (...)
    RETURNING id
  `

  // Send NOTIFY within same transaction
  if (result?.id) {
    await tx.exec`SELECT pg_notify('outbox_message', ${String(result.id)})`
  }
}

await tx.commit() // All-or-nothing
```

### 3. Relayer (Background Processing)

**File**: `src/services/events/api/startRelayer.ts`

**Two-Part Strategy**:

**Part A: Startup Sweep** (catches missed messages)

```typescript
await sweepUnprocessedMessages()
// Calls sweep_and_notify_outbox() function
// Ensures no messages lost during system restarts
```

**Part B: Real-Time LISTEN/NOTIFY**

```typescript
listenClient.on('notification', (msg) => {
  if (msg.channel === 'outbox_message') {
    void processOutboxMessage(msg.payload) // Process in background
  }
})

listenClient.on('error', (error) => {
  // Reconnection logic: 5 second retry on error
  setTimeout(() => setupListenNotify().catch(...), 5000)
})
```

**Message Processing**:

```typescript
async function processOutboxMessage(messageId: string) {
  const message = await eventsDatabase.queryRow`
    SELECT * FROM outbox
    WHERE id = ${messageId} AND processed_at IS NULL
  `

  const topicPublisher = topicRegistry.getTopicPublisher(message.topicName)
  await topicPublisher(message.messageData) // Publishes to Encore topic

  // Mark as processed only after successful publish
  await eventsDatabase.exec`
    UPDATE outbox SET processed_at = NOW() WHERE id = ${messageId}
  `
}
```

### 4. Topic Registration

**File**: `src/services/events/utils/registerTopic.ts`

**Type-Safe Factory Pattern**:

```typescript
export function registerTopic<T>(
  topicName: string,
  registration: TopicRegistration<T>,
): OutboxMessageFactory<T> {
  topicRegistry.registerTopicPublisher(topicName, registration.publish)

  return (data: T): OutboxMessage => ({
    topicName,
    messageData: data,
  })
}
```

**Usage Documentation**: See `registerTopic.ts:8-66` for comprehensive examples

## Step-by-Step Implementation Guide

### Step 1: Define the "First Step" Endpoint

This endpoint creates the initial entity and publishes to the outbox.

```typescript
import { api } from 'encore.dev/api'
import { events } from '~encore/clients'
import { generateId } from '~src/utils/id/generateId'
import { registerTopic } from '~src/services/events/utils/registerTopic'
import { EntityCreatedTopic } from '../topics/EntityCreatedTopic'

// Register topic for outbox pattern
const createEntityCreatedOutboxMessage = registerTopic('EntityCreated', {
  publish: async (data) => {
    await EntityCreatedTopic.publish(data) // ← Anonymous function wrapper required!
  },
})

export const createEntity = api(
  { expose: true, method: 'POST', path: '/entities' },
  async (params) => {
    const entityId = generateId({ mode: 'random' })

    const entityCreatedEvent = {
      name: 'EntityCreated',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: {
        name: 'Entity',
        id: entityId,
        service: { name: 'entities' },
      },
      data: {
        /* event data */
      },
    }

    // Atomic commit: events + outbox message
    await events.commitTransaction({
      events: [entityCreatedEvent],
      namespace: { slug: 'main' },
      outboxMessages: [
        createEntityCreatedOutboxMessage({
          entity: { id: entityId },
          namespace: { slug: 'main' },
        }),
      ],
    })

    return { id: entityId } // ← Return immediately to caller
  },
)
```

### Step 2: Define the "Next Step" Idempotent Endpoint

This endpoint is invoked by **BOTH** the caller AND the background job.

```typescript
import { api, APIError, ErrCode } from 'encore.dev/api'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { loadEntityAggregate } from '../aggregates/Entity/loadEntityAggregate'

export const processEntity = api(
  { expose: true, method: 'POST', path: '/entities/:id/process' },
  async ({ id, namespaceSlug = 'main' }) => {
    const namespace = { slug: namespaceSlug }

    // Use database transaction with advisory lock
    await using tx = await eventsDatabase.begin()

    // Lock pattern: namespace:operation:entityId
    // This ensures only one invocation (caller OR background job) proceeds
    await tx.exec`SELECT pg_advisory_xact_lock(
      hashtext(${namespace.slug} || ':process-entity:' || ${id})
    )`

    // Check if already processed (idempotency)
    const existing = await loadEntityAggregate({ id, namespace })

    if (existing?.status === 'processed') {
      // Second invocation returns cached result
      return {
        result: existing.result,
        processedBy: existing.processedBy, // Could be 'caller' or 'background-job'
      }
    }

    // First invocation: do the actual work
    const result = await performExpensiveOperation(id)

    // Record completion
    const entityProcessedEvent = {
      name: 'EntityProcessed',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: { name: 'Entity', id, service: { name: 'entities' } },
      data: { result },
    }

    await events.commitTransaction({
      events: [entityProcessedEvent],
      namespace,
    })

    return { result }
  },
)
```

### Step 3: Define Topic and Subscription

The subscription handler invokes the same endpoint as the caller.

```typescript
// topics/EntityCreatedTopic.ts
import { Topic } from 'encore.dev/pubsub'

export interface EntityCreatedMessage {
  entity: { id: string }
  namespace: { slug: string }
}

export const EntityCreatedTopic = new Topic<EntityCreatedMessage>(
  'EntityCreated',
  { deliveryGuarantee: 'at-least-once' },
)
```

```typescript
// subscriptions/onEntityCreated.ts
import { Subscription } from 'encore.dev/pubsub'
import { EntityCreatedTopic } from '../topics/EntityCreatedTopic'
import { entities } from '~encore/clients'

const onEntityCreated = new Subscription(
  EntityCreatedTopic,
  'onEntityCreated',
  {
    handler: async (message) => {
      // Background job calls the SAME endpoint as the caller
      // This is the racing pattern in action
      await entities.processEntity({
        id: message.entity.id,
        namespaceSlug: message.namespace.slug,
      })
      // If this throws, message stays unprocessed for automatic retry
    },
  },
)

export { onEntityCreated }
```

### Step 4: Caller Invokes Both Steps

The caller invokes the next step immediately, racing with the background job.

```typescript
// User-facing workflow (e.g., in another service or frontend API)
import { entities } from '~encore/clients'

async function createAndProcessEntity(params) {
  // Step 1: Create entity (returns immediately with ID)
  const { id } = await entities.createEntity(params)

  // Step 2: Caller immediately invokes next step
  // This races with the background job that was triggered in Step 1
  try {
    const processed = await entities.processEntity({
      id,
      namespaceSlug: 'main',
    })

    // Fast path: caller won the race and got result immediately
    return { id, result: processed.result, path: 'caller-fast-path' }
  } catch (error) {
    // If caller fails, background job will complete it
    // This is the safety net that provides eventual consistency
    return {
      id,
      status: 'processing',
      message: 'Background job will complete processing',
    }
  }
}
```

**Key Points**:

- `processEntity()` is called by **both** caller and background job
- Advisory lock ensures only one proceeds
- Idempotency check returns cached result for second invocation
- Caller gets fast response if it wins the race
- Background job guarantees completion if caller fails

## Advisory Lock Integration

### When to Use Advisory Locks

**✓ Use advisory locks when:**

- Preventing duplicate processing in concurrent requests
- Implementing idempotent endpoints that should execute exactly once per ID
- Multi-step operations where retry must be safe
- Racing pattern endpoints (both caller and background job)

**✗ Don't use advisory locks for:**

- Read-only operations (no side effects to prevent)
- Operations where concurrent execution is acceptable
- Short operations where lock overhead isn't worth it

### Lock Scope Pattern

**Format**: `namespace:operation:entityId`

```typescript
hashtext(${namespace.slug} || ':operation-name:' || ${entityId})
```

**Examples**:

- `main:process-entity:abc123`
- `main:payment-verification:xyz789`
- `main:credit-issuance-fulfillment:def456`

**Why This Works:**

- Locks per entity (not global)
- Locks per operation (multiple operations on same entity don't conflict)
- Locks per namespace (multi-tenant isolation)

### Complete Lock + Idempotency Pattern

```typescript
await using tx = await eventsDatabase.begin()

// 1. Acquire lock (blocks other invocations)
await tx.exec`SELECT pg_advisory_xact_lock(
  hashtext(${namespace.slug} || ':operation:' || ${id})
)`

// 2. Check existing state (idempotency)
const existing = await loadAggregate({ id, namespace })
if (existing?.completed) {
  return existing.result // Cached result
}

// 3. Perform operation (first invocation only)
const result = await doWork(id)

// 4. Record completion
await events.commitTransaction({
  events: [completionEvent],
  namespace,
})

return result
```

## Real-World Examples from Codebase

### Example A: Payment Verification → Credit Issuance

**The Flow:**

```
1. createPaymentVerification()
   ├─ Returns payment verification ID
   └─ Publishes PaymentVerificationCreated to outbox

2. RACING PATTERN BEGINS
   ├─ Caller: Immediately invokes createCreditIssuanceFulfillment(verificationId)
   └─ Background: onPaymentVerificationCreated subscription also invokes same endpoint

3. createCreditIssuanceFulfillment()
   ├─ Advisory lock: 'main:credit-issuance-fulfillment:verificationId'
   ├─ First arrival: Creates fulfillment + executes blockchain transaction
   └─ Second arrival: Finds existing fulfillment, returns cached result

4. Multi-step continues
   └─ Blockchain transaction, completion events, etc.
```

**Files**:

- **First Step**: `src/services/paymentVerifications/api/createPaymentVerification.ts`
  - Topic registration: lines 28-35
  - Advisory lock: lines 46-50
  - Outbox message: lines 123-135

- **Next Step**: `src/services/creditIssuanceFulfillments/api/createCreditIssuanceFulfillment.ts`
  - Advisory lock + idempotency check
  - External system coordination (blockchain)
  - Handles both caller and background job invocations

- **Background Job**: `src/services/creditIssuanceFulfillments/subscriptions/onPaymentVerificationCreated.ts`
  - Subscription handler
  - Invokes same endpoint as caller

### Example B: Signer → Account → Deployment

**Multi-Level Saga** with racing at each level:

```
Step 1: createSigner()
   ├─ Returns signer ID
   └─ Publishes SignerCreated to outbox

Step 2: createAccount() [RACING]
   ├─ Called by: Caller + Subscription (onSignerCreated)
   ├─ Advisory lock: 'main:account-provision:signerId'
   ├─ First: Creates account + publishes AccountAddressAssigned
   └─ Second: Returns cached account

Step 3: deployAccount() [RACING]
   ├─ Called by: Caller + Subscription (onAccountAddressAssigned)
   ├─ Advisory lock: 'main:deploy-account:accountId'
   ├─ First: Deploys smart custody contract on blockchain
   └─ Second: Returns cached deployment result
```

**Files**:

- `src/services/accounts/api/createSigner.ts` - First step
- `src/services/accounts/api/createAccount.ts` - Middle step with racing
- `src/services/accounts/api/deployAccount.ts` - Final step with racing
- `src/services/accounts/subscriptions/onSignerCreated.ts` - Background job for Step 2
- `src/services/accounts/subscriptions/onAccountAddressAssigned.ts` - Background job for Step 3

**Key Implementation Details:**

- Each step uses advisory lock: `hashtext(${namespace.slug} || ':operation:' || ${id})`
- Each step checks existing aggregate before proceeding
- Each step returns cached result for idempotency
- Outbox messages trigger background jobs that call same endpoints

## Anti-Patterns and Pitfalls

### ❌ Wrong: Direct Publishing Without Outbox

```typescript
// This has a dual-write problem!
await events.commitTransaction({ events: [...], namespace })
await MyTopic.publish(message) // ← Can fail after commit! Message lost!
```

**Problem**: If `publish()` fails, events are committed but message never delivered. Background job never runs.

**✓ Right: Use Outbox for Atomicity**

```typescript
await events.commitTransaction({
  events: [...],
  namespace,
  outboxMessages: [createMyOutboxMessage(message)] // ← Atomic with events
})
```

### ❌ Wrong: Forgetting Anonymous Function Wrapper

```typescript
// This breaks Encore's topic tracking!
const createMsg = registerTopic('MyTopic', {
  publish: MyTopic.publish, // ← Wrong! Direct reference
})
```

**Problem**: Encore can't properly track topic usage for `encore check`.

**✓ Right: Use Anonymous Function**

```typescript
const createMsg = registerTopic('MyTopic', {
  publish: async (data) => {
    await MyTopic.publish(data) // ← Correct! Wrapped in function
  },
})
```

### ❌ Wrong: No Advisory Lock in Racing Pattern

```typescript
export const processEntity = api({ ... }, async ({ id }) => {
  // No lock! Both caller and background job will execute concurrently
  const existing = await loadEntityAggregate({ id })
  if (existing) return existing.result

  const result = await doWork(id) // ← DUPLICATE WORK!
  // ...
})
```

**Problem**: Both invocations proceed concurrently, causing duplicate processing.

**✓ Right: Lock Before Checking**

```typescript
await using tx = await eventsDatabase.begin()
await tx.exec`SELECT pg_advisory_xact_lock(...)`
const existing = await loadEntityAggregate({ id })
// Now only one invocation proceeds
```

### ❌ Wrong: Lock Scope Too Broad

```typescript
// Locks ALL operations for namespace!
await tx.exec`SELECT pg_advisory_xact_lock(
  hashtext(${namespace.slug}) // ← Too broad!
)`
```

**Problem**: Serializes unrelated operations, killing performance.

**✓ Right: Lock Per Operation + Entity**

```typescript
await tx.exec`SELECT pg_advisory_xact_lock(
  hashtext(${namespace.slug} || ':operation:' || ${entityId}) // ← Specific!
)`
```

### ❌ Wrong: Using Pattern for Single-Step Operations

```typescript
// No multi-step operation, no external system - don't use outbox!
export const updateName = api({ ... }, async ({ id, name }) => {
  await events.commitTransaction({
    events: [nameUpdatedEvent],
    namespace,
    outboxMessages: [createNameUpdatedOutboxMessage({ ... })] // Unnecessary!
  })
})
```

**Problem**: Adds complexity without benefit. No next step to coordinate.

**✓ Right: Simple commitTransaction**

```typescript
await events.commitTransaction({
  events: [nameUpdatedEvent],
  namespace,
  // No outboxMessages - just commit the event
})
```

## Automatic Retry & Eventual Consistency

### How the Racing Pattern Ensures Completion

The racing pattern guarantees work completes through three possible scenarios:

#### Scenario 1: Caller Wins Race ✓

```
Timeline:
T0: Caller invokes createEntity() → returns ID + publishes to outbox
T1: Caller invokes processEntity(ID)
T2: Caller acquires lock, performs work, commits
T3: Background job invokes processEntity(ID)
T4: Background job finds lock + existing result
T5: Background job returns cached result

Result: ✓ Work completed by caller (fast path)
```

#### Scenario 2: Background Job Wins Race ✓

```
Timeline:
T0: Caller invokes createEntity() → returns ID + publishes to outbox
T1: Caller invokes processEntity(ID) but encounters network error
T2: Background job invokes processEntity(ID) (via subscription)
T3: Background job acquires lock, performs work, commits
T4: Caller retries (optional) and gets cached result

Result: ✓ Work completed by background job (self-healing)
```

#### Scenario 3: Both Fail Initially ✓

```
Timeline:
T0: Caller invokes createEntity() → returns ID + publishes to outbox
T1: Caller invokes processEntity(ID) → external system down, fails
T2: Background job invokes processEntity(ID) → external system still down, fails
T3: Subscription handler throws error → message NOT marked as processed
T4: Relayer retries background job (at-least-once delivery)
T5: External system recovers
T6: Background job retry succeeds, work completes

Result: ✓ System eventually reaches consistent state
```

### Key Guarantees

**Optimistic Execution**

- Caller attempts work immediately (no waiting for background job)
- Fast path: If caller succeeds, user gets immediate result
- Slow path: If caller fails, user gets "processing" status

**Guaranteed Completion**

- Background job provides safety net
- At-least-once delivery ensures retry until success
- Advisory lock ensures no duplicate work

**Self-Healing**

- Transient failures (network issues, timeouts) auto-recover
- External system outages eventually resolve with retry
- No manual intervention needed

**No Coordination**

- Caller and background job operate independently
- No need to check "who is processing this"
- Race outcome doesn't matter - both paths are valid

**Idempotency Safety**

- Advisory locks prevent concurrent execution
- State checks return cached results
- Retries are safe and efficient

**Audit Trail**

- Events document which path completed work
- Can trace: Caller path vs background job path
- Debugging and monitoring fully transparent

## Testing Considerations

### Mocking Topic Publishers

In test files, mock `registerTopic` to avoid publishing during tests:

```typescript
import { vi } from 'vitest'

vi.mock('~src/services/events/utils/registerTopic', () => ({
  registerTopic: vi.fn(() => vi.fn()),
}))
```

### Testing Outbox Message Creation

Verify outbox messages are created with correct structure:

```typescript
import { events } from '~encore/clients'

const mockCommitTransaction = vi.spyOn(events, 'commitTransaction')

await createEntity({ ... })

expect(mockCommitTransaction).toHaveBeenCalledWith({
  events: expect.arrayContaining([
    expect.objectContaining({ name: 'EntityCreated' })
  ]),
  namespace: { slug: 'main' },
  outboxMessages: expect.arrayContaining([
    expect.objectContaining({
      topicName: 'EntityCreated',
      messageData: expect.objectContaining({
        entity: { id: expect.any(String) }
      })
    })
  ])
})
```

### Testing Idempotency

Test that repeated invocations return same result:

```typescript
const result1 = await processEntity({ id: 'test-id' })
const result2 = await processEntity({ id: 'test-id' })

expect(result1).toEqual(result2)
// Verify work only executed once (check database, external system calls, etc.)
```

### Integration Testing

Reference comprehensive test suites:

- `src/services/events/api/__tests__/commitTransaction.test.ts` - Outbox message storage
- `src/services/events/api/__tests__/startRelayer.test.ts` - Message processing and retry

## Cross-References

### Related Skills

- **encore-event-sourcing** - For event creation patterns and `commitTransaction()` usage
- **encore-services** - For Encore topic definitions and subscription patterns
- **error-handling** - For when NOT to use try-catch (let errors bubble for retry)
- **testing** - For testing outbox implementations and idempotency

### Related Files

**Pattern Implementation:**

- `src/services/events/utils/registerTopic.ts` - Topic registration API
- `src/services/events/api/commitTransaction.ts` - Atomic transaction implementation
- `src/services/events/api/startRelayer.ts` - Background message processing

**Example Implementations:**

- `src/services/paymentVerifications/api/createPaymentVerification.ts` - First step example
- `src/services/creditIssuanceFulfillments/api/createCreditIssuanceFulfillment.ts` - Next step with racing
- `src/services/accounts/api/createAccount.ts` - Multi-level saga orchestration
