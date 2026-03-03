---
name: typescript-scripts
description: Use when writing one-off TypeScript and shell scripts in the monorepo.
---

## Where to Put Scripts

**Always use `bin/` folder** - Never create scripts in a `scripts/` folder.

- Scripts in `bin/` are automatically added to PATH by direnv
- Can be executed directly: `api` instead of `./bin/api.sh`
- Consistent location for all executable utilities

## Choosing the Right Shebang

### Decision Tree

```
Does the script need to call Encore backend services?
├─ YES → Does it also need direnv environment variables?
│        ├─ YES → #!/usr/bin/env -S direnv exec . encore exec -- npx tsx
│        └─ NO  → #!/usr/bin/env -S encore exec -- npx tsx
│
└─ NO  → Is it a TypeScript script?
         ├─ YES → #!/usr/bin/env -S npx tsx
         └─ NO  → #!/usr/bin/env bash
```

---

## Pattern 1: Encore-Dependent TypeScript Scripts

**Shebang:** `#!/usr/bin/env -S encore exec -- npx tsx`

**When to use:**

- Script needs to call Encore backend services directly
- Requires access to Encore configuration, secrets, or runtime
- Needs service-to-service communication

**Example structure:**

```typescript
#!/usr/bin/env -S encore exec -- npx tsx

import { commitTransaction } from '~src/services/events/api/commitTransaction'
import { generateId } from '~src/utils/id/generateId'
import type { Event } from '~src/services/events/types/Event'

async function main() {
  const namespaceSlug = 'default'

  // Can call Encore API endpoints directly
  const events: Event[] = [
    {
      id: generateId({ mode: 'random' }),
      type: 'TokenMinted',
      payload: { amount: 100 },
      timestamp: new Date().toISOString(),
    },
  ]

  await commitTransaction({
    events,
    namespace: { slug: namespaceSlug },
  })

  console.log('✓ Transaction committed')
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
```

**Real examples:**

- `bin/mintTokens.ts` - Mints tokens via Encore services
- `bin/fundPaymaster.ts` - Funds paymaster contract
- `bin/importDeployedAddresses.ts` - Imports contract addresses

---

## Pattern 2: Encore + Direnv TypeScript Scripts

**Shebang:** `#!/usr/bin/env -S direnv exec . encore exec -- npx tsx`

**When to use:**

- Script needs both Encore runtime AND environment variables from `.envrc`/`.env.local`
- Requires Encore secrets AND direnv environment setup

**Example structure:**

```typescript
#!/usr/bin/env -S direnv exec . encore exec -- npx tsx

import { secret } from 'encore.dev/config'

// Access Encore secrets
const PRIVATE_KEY = secret('AGENTAHOLIC_SHOWCASE_PRIVATE_KEY')

async function main() {
  // Access direnv environment variables
  const rootPath = process.env.AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH

  if (!rootPath) {
    throw new Error('AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH not set')
  }

  // Can also call Encore services
  // await someEncoreService.doSomething()

  console.log(`Working in: ${rootPath}`)
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
```

**Real example:**

- `bin/fetchIssuerAccountAddress.ts` - Needs both Encore secrets and direnv vars

---

## Pattern 3: Standalone TypeScript Scripts

**Shebang:** `#!/usr/bin/env -S npx tsx`

**When to use:**

- Script is self-contained and doesn't need Encore runtime
- Pure utility scripts (file manipulation, testing, CI/CD)
- No backend service calls required
- File system operations, data processing, tooling

**Example structure:**

```typescript
#!/usr/bin/env -S npx tsx

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

function processFiles(): void {
  const inputPath = resolve(__dirname, '../data/input.json')
  const data = JSON.parse(readFileSync(inputPath, 'utf-8'))

  // Process data...
  const processed = data.map((item: any) => ({
    ...item,
    processed: true,
  }))

  const outputPath = resolve(__dirname, '../data/output.json')
  writeFileSync(outputPath, JSON.stringify(processed, null, 2))

  console.log(`✓ Processed ${processed.length} items`)
}

processFiles()
```

---

## Pattern 4: Shell Scripts

**Shebang:** `#!/usr/bin/env bash`

**When to use:**

- Wrapping simple commands
- Dev workflow shortcuts
- Environment setup
- Complex multi-step workflows

### Simple Shell Wrapper

```bash
#!/usr/bin/env bash
set -e
cd $AGENTAHOLIC_SHOWCASE_MONOREPO_ROOT_PATH
encore run
```

**Real examples:**

- `bin/api.sh` - Start Encore backend
- `bin/web.sh` - Start Vite frontend

---

## Best Practices

### 1. Always Use Absolute Imports

```typescript
// ✓ Good
import { generateId } from '~src/utils/id/generateId'
import { events } from '~encore/clients'

// ✗ Bad
import { generateId } from '../src/utils/id/generateId'
```

### 2. Error Handling

```typescript
async function main() {
  // Script logic here
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
```

### 3. Make Scripts Executable

```bash
chmod +x bin/myScript.ts
```

### 4. Use Clear Console Output

```typescript
console.log('✓ Success message')
console.error('✗ Error message')
console.warn('⚠ Warning message')
console.log('ℹ Info message')
```

### 5. Shell Script Error Handling

```bash
#!/usr/bin/env bash
set -e # Exit on error

# Your script logic
```

### 6. Access Environment Variables Safely

```typescript
const apiKey = process.env.API_KEY
if (!apiKey) {
  throw new Error('API_KEY environment variable is required')
}
```

---

## Common Script Categories

### Development Workflow

- `api.sh` - Start Encore backend
- `web.sh` - Start Vite frontend
- `test.sh` - Run tests with proper locking

### Blockchain Operations

- `mintTokens.ts` - Mint tokens via smart contracts
- `fundPaymaster.ts` - Fund paymaster for gas sponsorship
- `importDeployedAddresses.ts` - Import contract addresses

### Setup & Maintenance

- `setup.sh` - Full development environment setup
- `updateGeneratedApiClient.sh` - Regenerate API clients

---

## Quick Reference

| Need Encore? | Need Direnv? | Shebang                                                  |
| ------------ | ------------ | -------------------------------------------------------- |
| ✓            | ✓            | `#!/usr/bin/env -S direnv exec . encore exec -- npx tsx` |
| ✓            | ✗            | `#!/usr/bin/env -S encore exec -- npx tsx`               |
| ✗            | N/A          | `#!/usr/bin/env -S npx tsx`                              |
| N/A (Shell)  | N/A          | `#!/usr/bin/env bash`                                    |

---

## Examples to Reference

When writing new scripts, refer to these existing examples:

- **Encore + Services:** `bin/mintTokens.ts`
- **Encore + Direnv:** `bin/fetchIssuerAccountAddress.ts`
- **Standalone TS:** `bin/manageCoverageThresholds.ts`
- **Simple Shell:** `bin/api.sh`
- **Complex Shell:** `bin/test.sh`, `bin/updateGeneratedApiClient.sh`
