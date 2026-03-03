---
name: writing-typescript
description: Use when writing TypeScript code in this project.
---

## Logging Guidelines

This project enforces strict logging practices through a pre-commit hook (`.claude/hooks/check-console-statements.sh`).

### Console Statement Restrictions

**All `console.*` statements are blocked in TypeScript files (.ts/.tsx)**, including:

- `console.log`
- `console.debug`
- `console.info`
- `console.warn`
- `console.error`
- `console.trace`
- `console.dir`
- `console.table`
- `console.time` / `console.timeEnd`
- `console.group` / `console.groupEnd` / `console.groupCollapsed`
- `console.count` / `console.countReset`
- `console.assert`
- `console.clear`

### Preferred Logging Approach

**Always use the `debug()` function from the 'debug' package instead:**

```typescript
import { debug } from '~src/utils/debug/debug'

// Good - Use debug() for logging
debug('Processing payment:', payment.id)
debug('User created:', { userId: user.id, email: user.email })
```

**Never use console.\* directly:**

```typescript
// Bad - Will be blocked by the hook
console.log('Processing payment:', payment.id)
console.error('Error occurred:', error)
```

### Exception Mechanism

If you **absolutely must** use `console.*` statements, add this comment on the line immediately before:

```typescript
// claude-hooks-ignore-logging-violation
console.log('Critical system output that must use console')
```

Or inline on the same line:

```typescript
console.log('Critical output') // claude-hooks-ignore-logging-violation
```

**Important:** Only use this exception for truly necessary cases (e.g., CLI output, critical system messages). For all standard logging, use `debug()`.
