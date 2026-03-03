## Ethereum Address Types

When working with Ethereum addresses in TypeScript, never use the `0x${string}` type in aggregate schemas or Encore-compatible code. This type is not compatible with Encore's serialization and type system.

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
