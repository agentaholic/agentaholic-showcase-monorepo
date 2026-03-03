# Business-Agnostic System Architecture

## Overview

This document describes the architecture of our event-sourced, service-oriented application built on CQRS (Command Query Responsibility Segregation) and Event Sourcing principles. The system is designed as a collection of decoupled services that communicate through well-defined APIs and asynchronous messaging patterns.

This is considered a business-agnostic document because it describes the components of the architecture that do not directly pertain to our business logic.

## Core Architectural Principles

### 1. Event Sourcing & CQRS

The system's foundation is built on **Event Sourcing**, where domain events serve as the primary source of truth. These events capture all changes to the system state and provide a complete audit trail of business operations.

**Command Query Responsibility Segregation (CQRS)** is implemented to separate read and write operations, allowing for optimized data models and scalable query patterns.

### 2. Service-Oriented Architecture (SOA)

The application is composed of **decoupled services** that operate independently while collaborating to deliver business functionality. Each service is responsible for a specific business domain and maintains clear boundaries.

### 3. Vertical Slicing

Each service follows the **vertical slicing** pattern, encompassing:

- **User Interface (UI)** components
- **Backend** business logic and APIs
- **Database** schema and data access layers

This approach ensures that each service is a complete, deployable unit of functionality.

## Core Data Structure: Domain Events

### Two-Layer Domain Event Architecture

Domain events in the system follow a **two-layer architecture**:

1. **Inner Layer**: Core domain event information (BaseDomainEvent)
2. **Outer Layer**: Namespace-aware wrapper with metadata (NamespaceEvent)

### Base Domain Event Structure

The inner layer contains the core business event information:

```typescript
type BaseDomainEvent = {
  id: string
  version: number
  name: string
  aggregate: {
    name: string
    id: string
    service: { name: string }
  }
  data: unknown
}
```

### Namespace Event Wrapper

The outer layer wraps the domain event with system-level metadata:

```typescript
type NamespaceEvent<E> = E & {
  metadata: {
    namespace: { slug: string }
    timestamp: string
    transaction: { id: string }
    revision: number
  }
}
```

### Complete Event Structure

The complete event structure stored in the event store is:

```typescript
type StoredDomainEvent = NamespaceEvent<BaseDomainEvent>
```

### Domain Event Properties

#### BaseDomainEvent Properties

- **`id`**: Unique identifier for the event
- **`version`**: Event schema version for backward compatibility
- **`name`**: Descriptive name of the event type
- **`aggregate`**: Contains aggregate information including:
  - `name`: The aggregate type
  - `id`: Unique identifier of the aggregate instance
  - `service.name`: The service that owns this aggregate
- **`data`**: Event-specific payload containing business data

#### NamespaceEvent Metadata Properties

- **`metadata.namespace.slug`**: The namespace context for data isolation
- **`metadata.timestamp`**: When the event occurred (auto-populated by event store)
- **`metadata.transaction.id`**: Transaction identifier for atomic event grouping
- **`metadata.revision`**: The globally-unique position of the event within the event log

### Transaction-Based Event Grouping

#### Transaction Concept

All domain events are **grouped by transaction ID**, where each transaction contains one or more events. This grouping provides:

- **Atomic Commitment**: All events in a transaction are committed together to the event store
- **Consistency Guarantees**: Future reads will see all events in the transaction, never a partial set
- **Cross-Aggregate Atomicity**: Events can span multiple aggregates or aggregate instances within a single transaction

#### Transaction Boundaries

A transaction can include:

- Multiple events for the same aggregate instance
- Events across different aggregate instances of the same type
- Events across different aggregate types within the same service
- Events that need to be atomically visible to maintain business invariants

#### Transaction Lifecycle

1. **Transaction Creation**: A unique transaction ID is generated
2. **Event Generation**: Domain events are created with the transaction ID
3. **Atomic Commit**: All events in the transaction are committed together via `events.commitTransaction`
4. **Visibility**: All events become visible atomically after successful commit

## Namespace Architecture

### Purpose

Namespaces provide logical separation of data within a single environment, enabling:

- **Production data isolation** from test data
- **Testing in production** scenarios
- **Multi-tenant-like** data segregation

### Namespace Types

- **`main` namespace**: Contains real production data
- **Non-main namespaces**: Used for synthetic data, testing, and experimental features

### Implementation

All domain events are tagged with a namespace, allowing services to:

- Filter data by namespace context
- Maintain data integrity across different operational contexts
- Support complex testing scenarios without data contamination

## Service Architecture

### Service Boundaries

Each service is designed around **Domain-Driven Design (DDD)** principles:

```
src/services/
├── userManagement/
│   ├── aggregates/
│   ├── events/
│   └── api/
├── orderProcessing/
│   ├── aggregates/
│   ├── events/
│   └── api/
└── events/
    ├── storage/
    └── api/
```

### Service Responsibilities

1. **Aggregate Management**: Each service owns specific aggregates
2. **Event Generation**: Services generate domain events for their aggregates
3. **API Endpoints**: Within the CQRS paradigm, both commands (write operations) and queries (read operations) are implemented as API endpoints that handle business operations and provide data access
4. **API Exposure**: Offer well-defined interfaces for external communication through organized endpoints

### Event Ownership and Isolation

#### Core Principle: Event Isolation

- **Services own their domain events**: Each service has exclusive ownership of its domain events
- **No cross-service event reading**: Services cannot directly access domain events from other services
- **Encapsulation**: Domain events are private to the owning service

#### Exception: Events Service

The **Events Service** is a special service that:

- Provides centralized storage for all domain events
- Acts as the **Event Store** for the entire system
- Offers infrastructure for event persistence and retrieval
- Does not contain business logic related to specific domains
- Manages transaction-based atomic event commitment

#### Events Service API

The Events Service provides the following key endpoint:

##### `events.commitTransaction`

**Purpose**: Atomically commit a transaction of domain events to the event store.

**Request Structure**:

```typescript
type CommitTransactionRequest = {
  events: BaseDomainEvent[]
  namespace: { slug: string }
}
```

**Functionality**:

- Generates a unique transaction ID for the event group
- Auto-populates metadata for each event:
  - `metadata.namespace.slug` from the request
  - `metadata.timestamp` with the current timestamp
  - `metadata.transaction.id` with the generated transaction ID
- Atomically commits all events in the transaction to the event store
- Ensures all events are visible together or none at all

**Usage Pattern**:

```typescript
// Service generates domain events
const domainEvents: BaseDomainEvent[] = [
  {
    id: 'event-1',
    version: 1,
    name: 'UserRegistered',
    aggregate: {
      name: 'User',
      id: 'user-123',
      service: { name: 'userManagement' },
    },
    data: { email: 'user@example.com' },
  },
  {
    id: 'event-2',
    version: 1,
    name: 'WelcomeEmailQueued',
    aggregate: {
      name: 'EmailQueue',
      id: 'queue-456',
      service: { name: 'userManagement' },
    },
    data: { userId: 'user-123', template: 'welcome' },
  },
]

// Commit transaction atomically
await events.commitTransaction({
  events: domainEvents,
  namespace: { slug: 'main' },
})
```

## Communication Patterns

### 1. Synchronous Communication

**Service-to-Service API Calls** are used for:

- Real-time data access
- Transactional operations requiring immediate consistency
- Query operations across service boundaries

```typescript
// Example: User service calling Order service
const orderData = await orderService.getOrdersByUser(userId)
```

### 2. Asynchronous Communication

**PubSub Topics** with **Purpose-Built Events** are used for:

- Event-driven workflows
- Decoupled service communication
- Background processing

#### Purpose-Built Events vs Domain Events

- **Domain Events**: Internal to services, capture business state changes
- **Purpose-Built Events**: External messages designed for inter-service communication

```typescript
// Domain Event (internal) - Base layer
type UserRegisteredDomainEvent = BaseDomainEvent & {
  name: 'UserRegistered'
  data: {
    userId: string
    email: string
    registrationTime: string
  }
}

// Domain Event as stored in event store
type StoredUserRegisteredEvent = NamespaceEvent<UserRegisteredDomainEvent>

// Purpose-Built Event (external)
type UserWelcomeEvent = {
  type: 'UserWelcome'
  userId: string
  email: string
  welcomeMessageTemplate: string
}
```

### 3. Event Repackaging

When a service needs to communicate domain changes to other services:

1. **Domain Event** is generated and stored internally
2. **Purpose-Built Event** is created based on the domain event
3. **PubSub Topic** publishes the purpose-built event
4. **Consuming Services** receive and process the purpose-built event

## Data Flow Architecture

### Write Path (Commands)

1. **HTTP Request** arrives at a service API endpoint
2. **API Endpoint** processes the command request
3. **Business Logic** executes the command
4. **Domain Events** are generated (BaseDomainEvent instances)
5. **Transaction Commit** occurs via `events.commitTransaction`:
   - Events are wrapped with metadata (timestamp, namespace, transaction ID)
   - All events in the transaction are atomically committed to the event store
6. **Purpose-Built Event** is published (if needed)
7. **Response** is returned to client

### Read Path (Queries)

1. **HTTP Request** arrives at a service API endpoint
2. **API Endpoint** processes the query request
3. **Read Model** is accessed (potentially built from events)
4. **Data** is returned to client

### Cross-Service Data Access

1. **Service A** needs data from **Service B**
2. **Service A** makes API call to **Service B**
3. **Service B** returns requested data
4. **Service A** continues processing

## Scalability and Performance Considerations

### Event Store Optimization

- **Partitioning** by service and aggregate
- **Indexing** on commonly queried fields
- **Snapshotting** for large aggregates
- **Event replay** capabilities for system recovery

### Service Scaling

- **Horizontal scaling** of individual services
- **Independent deployment** of services
- **Load balancing** across service instances
- **Caching** at service boundaries

### Namespace Performance

- **Efficient filtering** by namespace
- **Separate indexes** per namespace where needed
- **Namespace-aware** query optimization

## Technology Stack

### Backend Framework

- **Encore.ts**: TypeScript backend framework for type-safe service development

### Event Storage

- Centralized event store managed by the Events Service
- Optimized for append-only workloads and event replay

### Communication

- **HTTP APIs** for synchronous communication
- **PubSub messaging** for asynchronous communication
- **Type-safe** service contracts

## Benefits of This Architecture

### 1. Scalability

- Services can be scaled independently
- Event sourcing enables horizontal scaling of read operations
- Clear service boundaries prevent bottlenecks

### 2. Maintainability

- Vertical slicing reduces coupling
- Event isolation simplifies debugging
- Clear ownership boundaries

### 3. Testability

- Namespace separation enables testing in production
- Event replay supports comprehensive testing scenarios
- Service isolation simplifies unit testing

### 4. Auditability

- Complete event history provides audit trails
- Immutable event log ensures data integrity
- Time-travel debugging capabilities
- Transaction grouping provides clear causality relationships

### 5. Consistency

- **Atomic Event Commitment**: Transaction-based grouping ensures all related events are committed together
- **No Partial Reads**: Services never see incomplete sets of related events
- **Cross-Aggregate Consistency**: Multiple aggregates can be updated atomically within a single transaction
- **Failure Isolation**: Failed transactions don't leave the system in an inconsistent state

### 6. Flexibility

- New services can be added without affecting existing ones
- Event schema evolution supports system growth
- Multiple deployment strategies supported

## Conclusion

This architecture provides a robust foundation for building scalable, maintainable, and testable applications. By combining CQRS, Event Sourcing, and Service-Oriented Architecture principles with careful attention to service boundaries and communication patterns, the system can grow and evolve while maintaining performance and reliability.

The **transaction-based event grouping** ensures strong consistency guarantees while maintaining the benefits of event sourcing. The **two-layer domain event structure** separates business concerns (BaseDomainEvent) from infrastructure concerns (NamespaceEvent metadata), providing clean abstractions and flexibility.

The namespace system enables sophisticated testing strategies, while the event isolation principle ensures that services remain decoupled and independently deployable. The Events Service provides the necessary infrastructure for centralized event storage and atomic transaction commitment while maintaining the architectural integrity of the overall system.
