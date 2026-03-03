# Agentaholic Showcase Project Guide

A React + Vite frontend with Encore.ts backend services monorepo using Event Sourcing and CQRS patterns.

---

IF A PROMPT MENTIONS A LINEAR TICKET BY ID, IN THE FORMAT "AGE-\*", THEN MAKE SURE YOU FETCH THE TICKET AND CONSIDER THE CONTENTS OF IT BEFORE PROCEEDING WITH ANY OTHER ACTIONS

---

## Quick Reference

### Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS, Tanstack Query
- **Backend:** Encore.ts, Event Sourcing + CQRS, PostgreSQL
- **Testing:** Vitest
- **Dev Tools:** Hygen templates, Graphite, Linear

### Path Aliases

- `~src/*` → `./src/*` (always use absolute imports, never relative)
- `~encore/*` → `./encore.gen/*` (Encore generated clients)

### Identifier System

- Uses **flickrBase58** encoding by default
- `generateId({ mode: 'random' })` for creating IDs
- `convertId()` for format conversion

---

## Critical Patterns (Used 80%+ of Time)

### Imports

```typescript
// ✓ Always use absolute imports
import { generateId } from '~src/utils/id/generateId'
import { events } from '~encore/clients'

// ✗ Never use relative imports
import { generateId } from '../../../utils/id/generateId'
```

### Backend vs Frontend API Usage

```typescript
// Backend service-to-service
import { payments } from '~encore/clients'
await payments.createPayment(...)

// Frontend API calls
import { apiClient } from '~src/utils/api/apiClient'
await apiClient.payments.createPayment(...)
```

### Naming: Avoid Abbreviations and Acronyms

Prefer full, descriptive names over abbreviations and acronyms. Spelled-out names are easier to read, search for, and understand without prior context.

```typescript
// ✓ Good — full words
effectiveAnnualPercentageYield
transactionHash
maximumRetryCount
sourceAddress

// ✗ Bad — abbreviated
effectiveAPY
txHash
maxRetryCnt
srcAddr
```

**When an acronym is unavoidable** (e.g. well-known domain terms where the spelled-out form would be unnatural), treat it like a regular word in camelCase — only capitalize the first letter:

```typescript
// ✓ Good — acronym follows camelCase rules
httpClient
apiClient
jsonParser
htmlElement
nftMetadata
erc20Token

// ✗ Bad — all-caps acronym breaks camelCase flow
HTTPClient
APIClient
JSONParser
HTMLElement
NFTMetadata
ERC20Token
```

This keeps casing predictable and consistent, especially at word boundaries like `getHttpResponse` vs `getHTTPResponse`.

### Encore Endpoint Conventions

- Always use `method: 'POST'` for all endpoints (including getters)
- Never specify a `path:` parameter on endpoints

### Running Tests

Tests use a workspace-based architecture where each `@agentaholic-showcase/*` package has its own test task with Turbo caching.

```bash
npm test                  # Run all tests with Turbo caching
TURBO_FORCE=1 npm test    # Run all tests, bypassing cache
ENCORE_LOG=debug npm test # Run with Encore debug logging
```

**Running specific workspace tests:**

```bash
npm test -w @agentaholic-showcase/events-api            # Run tests for a specific workspace
npx turbo test --filter='@agentaholic-showcase/events-*' # Run tests matching a pattern
```

**Test file organization:**

- Tests live in `__tests__/` subdirectories within each workspace
- Example: `src/services/payments/features/__tests__/someFeature.test.ts`
- The `bin/workspace-test.sh` script handles Encore runtime setup for each workspace

---

## Detailed Guidelines (Skills)

When you need specific guidance on topics, refer to these skill files for comprehensive documentation:

### Skill Loading Guidelines

**ALWAYS load the `git-workflow` skill before:**

- Running any `git` commands (commit, branch, checkout, add, push, pull, merge, rebase, stash, etc.)
- Creating or switching branches
- Committing changes (staged or unstaged)
- Creating pull requests
- Working with Linear ticket IDs (AGE-\*)
- Using Graphite CLI (`gt` commands)
- Managing version control workflow

### Code Style & TypeScript

- **typescript-style** - Module structure, file naming, code organization
- **typescript-types** - Type patterns, nested key references, Encore compatibility
- **error-handling** - When/how to use try-catch, error recovery patterns
- **eslint-rules** - ESLint compliance, fixing linting errors

### Encore Framework

- **encore-services** - Service structure, endpoints, type sync, topics
- **encore-event-sourcing** - Events, aggregates, CQRS patterns, naming conventions

### Frontend Development

- **react-frontend** - React patterns, components, routing
- **frontend-api** - API client usage, React Query integration

### Development Workflow

- **git-workflow** - Commits, branches, PRs, Linear integration
- **code-generation** - Hygen templates for services, aggregates, events
- **testing** - Test patterns
- **typescript-scripts** - Writing scripts in bin/, choosing shebangs (encore vs tsx vs bash)

---

## Service Structure Pattern

```
src/services/{serviceName}/
├── encore.service.ts          # Service definition
├── api/                       # Endpoints (one file per endpoint)
├── aggregates/{AggregateName}/ # Event sourcing aggregates
├── database/                   # Database configurations
├── types/                     # Type definitions
└── utils/                     # Service-specific utilities
```

---

## Working with New Sub-folders (Workspace Setup)

When new sub-folders are created (e.g. via Hygen templates like `hygen service new`, `hygen aggregate new`, or `hygen aggregate add-getter`), you must run the corresponding workspace conversion script to deterministically configure the repo for the new workspace. This handles creating `package.json` + `turbo.json`, registering in root `package.json` workspaces, adding to root `turbo.json` dependsOn, adding vitest exclude patterns, and moving test files to `__tests__/`.

### Workspace Naming Convention

Workspace names follow the pattern `@agentaholic-showcase/{serviceName}-{subfolder}` where the service name **preserves its original camelCase** and is joined to the subfolder by a hyphen. Do NOT convert the service name to kebab-case.

```
# Service workspaces: @agentaholic-showcase/{camelCaseServiceName}-{subfolder}
@agentaholic-showcase/ordersV2-api          ✓ (camelCase service name)
@agentaholic-showcase/orders-v2-api         ✗ (wrong — kebab-cased service name)
@agentaholic-showcase/accountBalances-utils ✓
@agentaholic-showcase/dataIngestion-api     ✓

# Utility workspaces: @agentaholic-showcase/utils-{camelCaseUtilName}
@agentaholic-showcase/utils-bigint          ✓
@agentaholic-showcase/utils-childProcesses  ✓
```

### Conversion Scripts

**For service sub-folders** (e.g. `src/services/{serviceName}/api/`, `aggregates/`, `utils/`):

```bash
./bin/convertToWorkspace.sh {serviceName} {subfolder}
# Example: ./bin/convertToWorkspace.sh ordersV2 api
```

**For utility sub-folders** (e.g. `src/utils/{utilName}/`):

```bash
./bin/convertUtilToWorkspace.sh {utilName}
# Example: ./bin/convertUtilToWorkspace.sh chains
```

After running the conversion script, remember to:

1. Add appropriate `dependsOn` entries to the new workspace's `turbo.json` (check sibling services for the pattern)
2. Run `npm install` to update `package-lock.json`
3. Run tests to verify: `npm test -w @agentaholic-showcase/{serviceName}-{subfolder}`

---

## Common Commands

```bash
# Testing
npm test

# Encore
encore check                      # Sync type definitions
./bin/updateGeneratedApiClient.sh # Update frontend API client, which also runs `encore check`

# Code Generation
npx hygen service new --name {serviceName}
npx hygen aggregate new --serviceName {name} --aggregateName {Name} --eventName {Event}
npx hygen aggregate add-event --serviceName {name} --aggregateName {Name} --eventName {Event}
npx hygen aggregate add-getter --serviceName {name} --aggregateName {Name}
```

---

## Top-level Repo Structure

### Essential Folders

- **bin/** - Executable scripts for development and operations. **Always prefer this over scripts/ folder.**
  - Shell scripts for dev workflow (api, web, test)
  - Mix of Encore-dependent and standalone scripts
- **src/** - Main monorepo source code
  - **services/** - Encore.ts backend services (event sourcing + CQRS)
  - **app/** - React frontend application
  - **utils/** - Shared utilities
- **\_templates/** - Hygen code generation templates

### Configuration & Environment

- **direnv** - Project uses direnv for environment management (config in `.envrc`)
  - Automatically adds `bin/` to PATH (scripts can be called directly)
  - Sets up core paths and PM2 configuration
  - Loads `.envrc.local` for machine-specific overrides
- **.env.local** - Environment variables and secrets (gitignored)
  - API keys, configuration
- **encore.gen/** - Auto-generated Encore client code (don't edit manually)

### Supporting Folders

- **docs/** - Project documentation
- **public/** - Static web assets
- **patches/** - npm package patches (patch-package)
- **dist/** - Build output
