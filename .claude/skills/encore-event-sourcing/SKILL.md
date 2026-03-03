---
name: encore-event-sourcing
description: Use when working with events, aggregates, event sourcing, CQRS patterns, or domain events.
---

## Event Sourcing Architecture

This project uses **Event Sourcing + CQRS** architecture with **PostgreSQL** for event storage via Encore's database integration.

### Event Sourcing Pattern

- Events stored in PostgreSQL via Encore database integration
- Use `events.commitTransaction()` for atomic event commits (not `insertEvent()`)
- Event stream access via `events.getEventStream()`
- Generate event IDs with `generateId({ mode: 'random' })`
- All identifiers use flickrBase58 encoding via `convertId()` utilities

## Event Sourcing Endpoints

When creating Encore endpoints that work with event sourcing patterns:

### Event Creation and Submission

- Always use `events.commitTransaction({ events: [...], namespace })` instead of `events.insertEvent()` when working with domain events
- Import the specific event type from the event definition file and use it for proper type safety
- Create the complete event object with proper typing before submitting it to the transaction

### Event ID Generation

- Use `generateId({ mode: 'random' })` when generating IDs for events to ensure proper randomness

### Aggregate Validation

- In event sourcing systems, aggregates are created automatically when the first event is committed
- Avoid adding validation that prevents new aggregate creation unless explicitly required by business logic
- Trust the event sourcing system to handle aggregate lifecycle management

### Example Pattern

```typescript
import { EventType } from '../aggregates/AggregateType/events/EventName/EventType'

const event: EventType = {
  name: 'EventName',
  version: 1,
  id: generateId({ mode: 'random' }),
  aggregate: {
    name: 'AggregateType',
    id: aggregateId,
    service: { name: 'serviceName' },
  },
  data: {
    // event data
  },
}

await events.commitTransaction({
  events: [event],
  namespace,
})
```

## Event Naming Conventions

When creating domain events in event sourcing aggregates, always follow this naming convention:

**Event names should be descriptive and include the aggregate name for clarity:**

- ✅ **Good**: `StripePaymentIntentCreated`, `UserRegistered`, `OrderShipped`, `PaymentCompleted`
- ❌ **Bad**: `Created`, `Updated`, `Deleted`, `Started`

**Rules:**

1. **Be specific**: Event names should clearly describe what happened
2. **Include aggregate context**: For complex domains, include the aggregate name (e.g., `StripePaymentIntentCreated` instead of just `Created`)
3. **Use past tense**: Events represent things that have already happened
4. **Use PascalCase**: Follow TypeScript naming conventions

**Examples:**

- Instead of `Created` → Use `StripePaymentIntentCreated`
- Instead of `Updated` → Use `UserProfileUpdated`
- Instead of `Deleted` → Use `OrderCanceled`
- Instead of `Started` → Use `PaymentProcessingStarted`

This convention ensures events are self-documenting and reduces ambiguity when working with multiple aggregates in large systems.

## Aggregate Response Fields

When writing "get"-like endpoints that load aggregates by ID, always use the generic field name "aggregate" in the response type instead of naming the field after the specific aggregate type.

This provides consistency across all aggregate-loading endpoints and makes the API more predictable for consumers.

Examples:

- Instead of `{ googleCalendar: GoogleCalendarAggregate }`, use `{ aggregate: GoogleCalendarAggregate }`
- Instead of `{ googleCalendarEvent: GoogleCalendarEventAggregate }`, use `{ aggregate: GoogleCalendarEventAggregate }`
- Instead of `{ token: GoogleOAuth2CredentialsTokenAggregate }`, use `{ aggregate: GoogleOAuth2CredentialsTokenAggregate }`

This convention ensures that all aggregate-loading endpoints follow the same response structure pattern, making the codebase more maintainable and the API more intuitive for developers consuming these endpoints.

## Aggregate Consumption Pattern

When consuming "get"-like endpoints that load aggregates, always use destructuring with the generic field name "aggregate" and alias it to a more descriptive variable name that indicates the specific aggregate type.

This pattern maintains consistency with the aggregate response field convention while providing clear variable names in the consuming code.

Examples:

- Use `const { aggregate: googleCalendarAggregate } = await googleCalendars.getGoogleCalendar({ id: '...' })`
- Use `const { aggregate: googleCalendarEventAggregate } = await googleCalendarEvents.getGoogleCalendarEvent({ id: '...' })`
- Use `const { aggregate: tokenAggregate } = await googleOAuth2CredentialsTokens.getGoogleOAuth2CredentialsToken({ id: '...' })`

This approach ensures consistent consumption patterns across all aggregate-loading endpoint calls and makes the code more readable by clearly indicating what type of aggregate is being loaded.

## Subscription Naming Convention

When naming a subscription that listens to domain events, use the format `on{EventName}` for the subscription name.

**Examples:**

- `onPaymentCreated` - Subscription for PaymentCreated events
- `onUserRegistered` - Subscription for UserRegistered events
- `onOrderShipped` - Subscription for OrderShipped events

This convention makes it clear that these are event handlers/subscriptions and maintains consistency throughout the codebase.
