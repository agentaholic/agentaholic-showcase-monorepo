---
name: encore-services
description: Use when creating/modifying Encore services, working with endpoints, service clients, or Encore-specific patterns.
---

## Encore.ts Framework

This project is an Encore App using Encore.ts, which is an open source TypeScript backend framework for building robust type-safe applications. When working with this codebase, consider Encore.ts patterns, conventions, and best practices for backend development.

## Encore Services

When creating and defining new Encore services, follow these guidelines:

- Services should always exist under `src/services/{service name}` directory structure
- Encore service names should always use camel case
- The name of the service used in the `encore.service.ts` file should match the name of the folder
- Each service should be self-contained within its own directory under the services folder

### Service Structure

Services follow this pattern:

```
src/services/{serviceName}/
├── encore.service.ts          # Service definition
├── api/                       # Endpoints (one file per endpoint)
├── aggregates/{AggregateName}/ # Event sourcing aggregates
├── database/                   # Database configurations
├── types/                     # Type definitions
└── utils/                     # Service-specific utilities
```

## Encore Endpoints

When writing Encore service endpoints, follow these guidelines:

- Default to using "expose: false" for private endpoints unless otherwise specified
- When working with any of the Encore streaming APIs (such as StreamIn, StreamOut or StreamInOut), always use `method: 'POST'` because `method: 'GET'` is not supported for the streaming APIs
- When creating request and response types for endpoints, define these types in the same file as the endpoint itself rather than in separate type files. For example, for an endpoint named `getEventStream`, define `GetEventStreamRequest` and `GetEventStreamResponse` types directly in the endpoint file, not in separate files like `../types/GetEventStreamRequest.ts`
- Avoid specifying the path parameter unless otherwise specified

## Encore Documentation

When the term "Encore" is mentioned in a prompt, understand this as a shorthand for referring to the Encore.ts framework. When working with Encore packages (such as the `encore.dev` package) or Encore tools (such as the `encore` CLI tool), refer to the indexed Cursor docs on Encore.ts rather than searching the web for Encore API usage or documentation.

## Identifier Handling

This project uses flickrBase58-encoded identifiers by default. When working with identifiers, always use the helper functions provided in the utils directory:

- Use `generateId` from `src/utils/id/generateId.ts` when creating new identifiers
- Use `convertId` from `src/utils/id/convertId.ts` when converting between different identifier formats

These utilities ensure consistent identifier handling throughout the application and maintain compatibility with the flickrBase58 encoding standard used by the project.

## Encore Endpoint References

When referring to Encore endpoints in conversation, documentation, or code comments, always use the fully-qualified name format `<service>.<endpoint>` instead of just the endpoint name alone. This ensures clarity about which service an endpoint belongs to and maintains consistency throughout the codebase.

Examples:

- Use `events.getEventStream` instead of just `getEventStream`
- Use `events.commitTransaction` instead of just `commitTransaction`

This convention helps maintain clarity when discussing multiple services that may have similarly named endpoints.

## Encore Endpoint Interactions

When interacting with an Encore endpoint, never import the endpoint's function directly. Instead, import the endpoint's service client from the `~encore/clients` module and use the service client to call the endpoint.

This maintains proper service boundaries and follows Encore.ts best practices for inter-service communication.

Examples:

- Instead of importing `commitTransaction` directly from the events service
- Use `import { events } from "~encore/clients"` and call `events.commitTransaction()`
- Instead of importing `getEventStream` directly from the events service
- Use `import { events } from "~encore/clients"` and call `events.getEventStream()`

This pattern ensures type safety, proper service encapsulation, and maintains the integrity of the service-oriented architecture.

## Encore Type Sync

The type definitions of the service clients imported from `~encore/clients` can possibly become out of sync with the endpoint implementations during development.

When modifying or creating Encore endpoints, always use the `encore check` command to ensure that the type definitions of the clients imported from `~encore/clients` are updated and synchronized with the current endpoint implementations.

This command validates the type safety and ensures that all service client interfaces remain consistent with their corresponding endpoint definitions, preventing runtime errors caused by type mismatches.

## Encore Topic Usage

When working with Encore Topics and the transactional outbox pattern using `registerTopic`, you must wrap the topic's publish method in an anonymous function to follow proper Encore topic usage patterns.

**Required Pattern:**

```typescript
import { registerTopic } from '~src/services/events/utils/registerTopic'
import { MyTopic } from '~src/services/myService/topics/MyTopic'

// ✅ Correct: Use anonymous function wrapper
const createMyOutboxMessage = registerTopic('MyTopicName', {
  publish: async (data) => {
    await MyTopic.publish(data)
  },
})
```

**Invalid Pattern:**

```typescript
// ❌ Incorrect: Direct reference to topic.publish method
const createMyOutboxMessage = registerTopic('MyTopicName', {
  publish: MyTopic.publish, // This will cause Encore compilation errors
})
```

This anonymous function wrapper is required because Encore's topic system needs to properly track and validate topic usage at compile time. Direct method references bypass Encore's static analysis and will result in compilation errors.

## Key Services

- **events**: Core event sourcing service with `commitTransaction` and `getEventStream` endpoints
- **contracts**: Blockchain contract interaction service with chain management
