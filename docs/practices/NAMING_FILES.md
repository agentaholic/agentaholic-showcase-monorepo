## File Naming Conventions

When creating new files or folders, use camelCase or PascalCase depending on what the file exports. File names should match the casing of their primary export exactly.

### Core Principle

**File names must match their primary export's casing to maintain consistency and enable intuitive code navigation.**

### File Naming Rules

**Use PascalCase when the file exports:**

- Classes
- React components
- TypeScript interfaces
- TypeScript types
- Enums

**Use camelCase when the file exports:**

- Functions
- Constants
- Objects
- API endpoints

### TypeScript Files

**Good (PascalCase for types, classes, components):**

```
PaymentAggregate.ts          → export interface PaymentAggregate
UserProfile.ts               → export interface UserProfile
BaseDomainEvent.ts           → export class BaseDomainEvent
PaymentButton.tsx            → export const PaymentButton = () => {...}
ApiClient.ts                 → export class ApiClient
ErrorBoundary.tsx            → export class ErrorBoundary extends Component
```

**Good (camelCase for functions, endpoints, utilities):**

```
generateId.ts                → export const generateId = () => {...}
convertId.ts                 → export const convertId = () => {...}
createPayment.ts             → export const createPayment = api(...)
getPayment.ts                → export const getPayment = api(...)
registerTopic.ts             → export const registerTopic = () => {...}
apiClient.ts                 → export const apiClient = new ApiClient()
```

**Bad (casing doesn't match export):**

```
paymentAggregate.ts          → export interface PaymentAggregate  // ❌
payment-aggregate.ts         → export interface PaymentAggregate  // ❌
CreatePayment.ts             → export const createPayment = ...    // ❌
generate-id.ts               → export const generateId = ...       // ❌
api-client.ts                → export class ApiClient              // ❌
```

### Directory Naming

**Use camelCase for directories:**

```
src/
├── services/
│   ├── payments/              ✓ camelCase
│   ├── paymentVerifications/  ✓ camelCase
│   └── googleCalendars/       ✓ camelCase
├── utils/
│   ├── id/                    ✓ camelCase
│   └── api/                   ✓ camelCase
└── contexts/
    └── walletConnection/      ✓ camelCase
```

**Bad (other casing styles):**

```
src/
├── services/
│   ├── payment-verifications/  ❌ kebab-case
│   ├── google_calendars/       ❌ snake_case
│   └── PaymentService/         ❌ PascalCase
└── Utils/                      ❌ PascalCase
```

### Aggregate and Event Files

**Follow the service structure conventions:**

```
src/services/payments/aggregates/
├── Payment/
│   ├── PaymentAggregate.ts                    ✓ PascalCase (interface)
│   ├── events/
│   │   ├── PaymentCreated/
│   │   │   └── PaymentCreatedEvent.ts         ✓ PascalCase (type)
│   │   └── PaymentCompleted/
│   │       └── PaymentCompletedEvent.ts       ✓ PascalCase (type)
│   └── apply/
│       └── applyPaymentEvent.ts               ✓ camelCase (function)
```

### Test Files

**Match the casing of the file being tested, add `.test.ts` or `.spec.ts` suffix:**

```
generateId.ts         → generateId.test.ts          ✓
PaymentAggregate.ts   → PaymentAggregate.test.ts    ✓
createPayment.ts      → createPayment.test.ts       ✓
ApiClient.ts          → ApiClient.spec.ts           ✓
```

### Configuration Files

**Standard configuration files use their conventional names:**

```
package.json              ✓ Standard convention
tsconfig.json             ✓ Standard convention
eslint.config.js          ✓ Standard convention
vite.config.ts            ✓ Standard convention
.gitignore                ✓ Standard convention
```

### Special Files

**Use camelCase for service-level special files:**

```
encore.service.ts         ✓ Encore convention
encore.gen/               ✓ Encore convention
apiClient.ts              ✓ Instance/singleton
```

### React Component Files

**Use PascalCase with `.tsx` extension:**

```
PaymentButton.tsx         ✓ React component
LoginPage.tsx             ✓ React component
TabBarLayout.tsx          ✓ React component
UserProfile.tsx           ✓ React component
```

**Bad:**

```
paymentButton.tsx         ❌ Should be PascalCase
payment-button.tsx        ❌ No kebab-case
PaymentButton.jsx         ❌ Use .tsx for TypeScript
```

### Casing Styles to Avoid

**Never use:**

❌ **kebab-case** (hyphens): `payment-service.ts`, `user-profile.ts`
❌ **snake_case** (underscores): `payment_service.ts`, `user_profile.ts`
❌ **SCREAMING_SNAKE_CASE**: `PAYMENT_SERVICE.ts`
❌ **Mixed casing**: `paymentService.TS`, `Payment_Service.ts`

**Exception:** Configuration files that conventionally use kebab-case:

- `.eslintrc.json`
- `.prettierrc`
- `docker-compose.yml`

### Summary

**File naming rules:**

1. PascalCase for types, interfaces, classes, React components
2. camelCase for functions, endpoints, utilities, and directories
3. File name must exactly match the primary export name
4. Test files follow the same casing as the file they test
5. Never use kebab-case or snake_case for TypeScript files

**Quick reference:**

- `PaymentAggregate.ts` → `interface PaymentAggregate`
- `generateId.ts` → `function generateId()`
- `createPayment.ts` → `api createPayment`
- `PaymentButton.tsx` → `component PaymentButton`
- `payments/` → directory (always camelCase)

**Benefits:**

- Intuitive code navigation (filename matches import)
- Consistent codebase style
- Easier refactoring (rename file = rename export)
- Clear indication of what a file exports
