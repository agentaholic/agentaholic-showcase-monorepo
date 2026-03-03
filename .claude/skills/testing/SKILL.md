---
name: testing
description: Use when writing tests, running tests or test patterns.
---

## Testing & Quality

- **Vitest** for testing
- **ESLint** with strict TypeScript rules
- **Prettier** for code formatting
- **Husky** for git hooks with lint-staged

## Running Tests

In this project, use the following npm scripts to run the test suite:

```bash
npm test
```

This command runs tests and also checks types.

## Test File Naming

Test files should:

- Match the casing of the file being tested
- Add `.test.ts` or `.spec.ts` suffix
- Be located adjacent to the file they test

Examples:

- `generateId.ts` → `generateId.test.ts`
- `PaymentAggregate.ts` → `PaymentAggregate.test.ts`
- `createPayment.ts` → `createPayment.test.ts`

## Feature Specs

Feature specs are TypeScript test files, usually ending with the `.spec.ts` file extension. They are not markdown or text files.

Feature specs test user-facing features and workflows, often spanning multiple units of code.

## Test Patterns

### Testing Async Code

Always properly handle async code in tests:

```typescript
test('should handle async operation', async () => {
  const result = await someAsyncFunction()
  expect(result).toBe(expected)
})
```

### Mocking

- Mock external dependencies appropriately
- Use Vitest's mocking capabilities
- Keep mocks simple and focused

## Test Organization

Tests should:

- Be organized logically (arrange, act, assert)
- Have clear, descriptive test names
- Test one thing per test case
- Be isolated and independent
