# Code Generation Templates

This directory contains [Hygen](https://www.hygen.io/) templates for scaffolding new code structures.

## Available Templates

### New Service

Generate a new Encore service with the basic structure:

```bash
npm run generate:service
```

This will prompt you for:

- **Service name**: Must be in camelCase (e.g., `userManagement`, `paymentProcessing`)

The template creates:

- `src/services/{serviceName}/encore.service.ts` - Basic Encore service definition

### New Aggregate

Generate a new aggregate structure for an Encore service following the event sourcing and CQRS patterns:

```bash
npx hygen aggregate new
```

This will prompt you for:

1. **Service name** (camelCase): The name of the service where the aggregate will be created
2. **Aggregate name** (PascalCase): The name of the aggregate (e.g., "User", "Order", "Product")
3. **Initial event name** (PascalCase): The name of the first event for this aggregate (e.g., "Created", "Registered", "Added")

The template creates:

```
src/services/{serviceName}/aggregates/{AggregateName}/
├── events/
│   └── {AggregateName}{EventName}/
│       ├── {AggregateName}{EventName}Event.ts
│       └── on{AggregateName}{EventName}.ts
├── types/
│   └── {AggregateName}Aggregate.ts
├── {aggregateName}AggregateReducer.ts
├── {AggregateName}Event.ts
└── load{AggregateName}Aggregate.ts
```

**Files Created:**

- **{AggregateName}Aggregate.ts**: Type definition for the aggregate state
- **{AggregateName}Event.ts**: Union type of all events for this aggregate
- **{aggregateName}AggregateReducer.ts**: Reducer function that applies events to aggregate state
- **load{AggregateName}Aggregate.ts**: Function to load and hydrate the aggregate from events
- **{AggregateName}{EventName}Event.ts**: Type definition for the initial event
- **on{AggregateName}{EventName}.ts**: Event handler that processes the initial event

**Next Steps:**

After generating the aggregate:

1. Update the aggregate type in `types/{AggregateName}Aggregate.ts` with your domain properties
2. Update the event data in `events/{AggregateName}{EventName}/{AggregateName}{EventName}Event.ts`
3. Implement the event handling logic in `events/{AggregateName}{EventName}/on{AggregateName}{EventName}.ts`
4. Add additional events using the `add-event` template (see below)

### Add Event to Existing Aggregate

Add a new event to an existing aggregate structure:

```bash
npx hygen aggregate add-event
```

This will prompt you for:

1. **Service name** (camelCase): The name of the service containing the aggregate
2. **Aggregate name** (PascalCase): The name of the existing aggregate
3. **Event name** (PascalCase): The name of the new event to add (e.g., "Updated", "Deleted", "Activated")

The template creates new event files and automatically injects the necessary imports and type definitions into existing files:

**Files Created:**

- **events/{AggregateName}{EventName}/{AggregateName}{EventName}Event.ts**: Type definition for the new event
- **events/{AggregateName}{EventName}/on{AggregateName}{EventName}.ts**: Event handler for the new event

**Files Modified:**

- **{AggregateName}Event.ts**: Adds import and union type for the new event
- **{aggregateName}AggregateReducer.ts**: Adds import and case statement for the new event handler

This template uses special injection markers that are automatically inserted by the `aggregate new` template to know where to insert new content.

### Add Getter Endpoint for Existing Aggregate

Add a getter endpoint for an existing aggregate following the established patterns:

```bash
npx hygen aggregate add-getter
```

This will prompt you for:

1. **Service name** (camelCase): The name of the service containing the aggregate
2. **Aggregate name** (PascalCase): The name of the existing aggregate

The template creates:

**Files Created:**

- **api/get{AggregateName}.ts**: REST API endpoint for retrieving the aggregate by ID
- **api/get{AggregateName}.test.ts**: Comprehensive test file with 100% code coverage

**Features:**

- Follows exact patterns from existing getter endpoints (e.g., `getPayment`)
- Includes proper error handling with APIError for NotFound cases
- Uses v8 ignore comments for coverage optimization
- Supports namespacing with default 'main' namespace
- Provides complete test coverage including success, error, and edge cases

**Example endpoint created:**

- `GET /{service-name}-{aggregate-name}s/:id` - Retrieve aggregate by ID

## Usage Examples

```bash
# Generate a new service
npx hygen service new --name userManagement
# Creates: src/services/userManagement/encore.service.ts

# Generate a new aggregate
npx hygen aggregate new --serviceName users --aggregateName User --eventName Created
# Creates: src/services/users/aggregates/User/ with complete structure

# Add an event to existing aggregate
npx hygen aggregate add-event --serviceName users --aggregateName User --eventName Updated
# Creates: new event files and injects into existing files

# Add a getter endpoint to existing aggregate
npx hygen aggregate add-getter --serviceName users --aggregateName User
# Creates: api/getUser.ts and api/getUser.test.ts
```

## Template Structure

Templates are located in `_templates/{generator}/{action}/` directories:

- `_templates/service/new/` - New service generator
  - `index.cjs` - Configuration and prompts
  - `encore.service.ts.ejs.t` - Service file template

- `_templates/aggregate/new/` - New aggregate generator
  - `index.cjs` - Configuration and prompts
  - `aggregateType.ejs.t` - Aggregate type template
  - `aggregateEvent.ejs.t` - Aggregate event union template
  - `aggregateReducer.ejs.t` - Aggregate reducer template
  - `loadAggregate.ejs.t` - Load aggregate function template
  - `eventType.ejs.t` - Event type template
  - `eventHandler.ejs.t` - Event handler template

- `_templates/aggregate/add-event/` - Add event to existing aggregate generator
  - `index.cjs` - Configuration and prompts
  - `eventType.ejs.t` - New event type template
  - `eventHandler.ejs.t` - New event handler template
  - `injectEventImport.ejs.t` - Injects import into aggregate event file
  - `injectEventType.ejs.t` - Injects type into aggregate event union
  - `injectReducerImport.ejs.t` - Injects import into reducer file
  - `injectReducerCase.ejs.t` - Injects case statement into reducer

- `_templates/aggregate/add-getter/` - Add getter endpoint for existing aggregate generator
  - `prompt.cjs` - Configuration and prompts
  - `getterEndpoint.ejs.t` - REST API getter endpoint template
  - `getterEndpoint.test.ejs.t` - Comprehensive test file template
