#!/usr/bin/env -S npx tsx
/**
 * Auto-detect workspace turbo dependencies
 *
 * This script scans all workspaces for ~src/* imports and updates each
 * workspace's turbo.json dependsOn field accordingly.
 *
 * Usage:
 *   ./bin/updateWorkspaceTurboDependencies.ts --dry-run      # Show changes without writing
 *   ./bin/updateWorkspaceTurboDependencies.ts                # Update all workspaces
 *   ./bin/updateWorkspaceTurboDependencies.ts --workspace <path>  # Update single workspace
 *   ./bin/updateWorkspaceTurboDependencies.ts --verbose      # Show all detected imports
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, relative } from 'node:path'

const ROOT_DIR = process.cwd()

interface WorkspaceInfo {
  path: string
  packageName: string
  relativePath: string
}

interface TurboJson {
  $schema?: string
  extends?: string[]
  tasks?: {
    test?: {
      dependsOn?: string[]
      inputs?: string[]
      outputs?: string[]
      passThroughEnv?: string[]
    }
  }
}

interface ParsedArgs {
  dryRun: boolean
  workspace: string | null
  verbose: boolean
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2)
  const result: ParsedArgs = {
    dryRun: false,
    workspace: null,
    verbose: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--dry-run') {
      result.dryRun = true
    } else if (arg === '--verbose') {
      result.verbose = true
    } else if (arg === '--workspace') {
      result.workspace = args[++i] ?? null
    } else if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
  }

  return result
}

function printUsage(): void {
  // claude-hooks-ignore-logging-violation
  console.log(`Usage: ./bin/updateWorkspaceTurboDependencies.ts [options]

Options:
  --dry-run              Show changes without writing files
  --workspace <path>     Update only one workspace (relative path)
  --verbose              Show all detected imports
  --help, -h             Show this help message

Examples:
  ./bin/updateWorkspaceTurboDependencies.ts --dry-run
  ./bin/updateWorkspaceTurboDependencies.ts --workspace src/services/events/api
  ./bin/updateWorkspaceTurboDependencies.ts --verbose
`)
}

function loadWorkspaces(): WorkspaceInfo[] {
  const packageJsonPath = join(ROOT_DIR, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as {
    workspaces: string[]
  }

  const workspaces: WorkspaceInfo[] = []

  for (const workspacePath of packageJson.workspaces) {
    const fullPath = join(ROOT_DIR, workspacePath)

    if (!existsSync(fullPath)) {
      continue
    }

    const workspacePackageJsonPath = join(fullPath, 'package.json')
    if (!existsSync(workspacePackageJsonPath)) {
      continue
    }

    const workspacePackageJson = JSON.parse(
      readFileSync(workspacePackageJsonPath, 'utf-8'),
    ) as {
      name: string
    }

    workspaces.push({
      path: fullPath,
      packageName: workspacePackageJson.name,
      relativePath: workspacePath,
    })
  }

  return workspaces
}

function buildPathToPackageMap(
  workspaces: WorkspaceInfo[],
): Map<string, string> {
  const map = new Map<string, string>()

  for (const workspace of workspaces) {
    // Map the relative path (without leading src/) to package name
    // e.g., "services/events/api" -> "@agentaholic-showcase/events-api"
    // e.g., "utils/id" -> "@agentaholic-showcase/utils-id"
    map.set(workspace.relativePath, workspace.packageName)
  }

  return map
}

function importPathToWorkspacePath(importPath: string): string | null {
  // Convert ~src/services/events/api/something -> src/services/events/api
  // Convert ~src/utils/id/something -> src/utils/id

  if (!importPath.startsWith('~src/')) {
    return null
  }

  const relativePath = importPath.slice(5) // Remove "~src/"
  const parts = relativePath.split('/')

  // Handle src/services/{service}/{category}/* pattern
  if (parts[0] === 'services' && parts.length >= 3) {
    return `src/services/${parts[1]}/${parts[2]}`
  }

  // Handle src/utils/{name}/* pattern
  if (parts[0] === 'utils' && parts.length >= 2) {
    return `src/utils/${parts[1]}`
  }

  // Handle src/app/components/* pattern
  if (parts[0] === 'app' && parts[1] === 'components') {
    return 'src/app/components'
  }

  // Handle src/databases/surreal/projectionWriter/* pattern
  if (
    parts[0] === 'databases' &&
    parts[1] === 'surreal' &&
    parts[2] === 'projectionWriter'
  ) {
    return 'src/databases/surreal/projectionWriter'
  }

  // Handle src/viem/utils/* pattern
  if (parts[0] === 'viem' && parts[1] === 'utils') {
    return 'src/viem/utils'
  }

  return null
}

function findTsFiles(dir: string): string[] {
  const files: string[] = []

  function walk(currentDir: string): void {
    const entries = readdirSync(currentDir)

    for (const entry of entries) {
      const fullPath = join(currentDir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip node_modules and __tests__ directories
        // Test file imports don't affect workspace exports, so they shouldn't
        // create dependsOn entries that could lead to cycles
        if (entry !== 'node_modules' && entry !== '__tests__') {
          walk(fullPath)
        }
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        files.push(fullPath)
      }
    }
  }

  walk(dir)
  return files
}

function extractImports(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf-8')
  const imports: string[] = []

  // Match import statements with ~src/ paths
  // Handles: import { x } from '~src/...'
  // Handles: import x from '~src/...'
  // Handles: import '~src/...'
  const importRegex =
    /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g

  let match
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1]
    if (importPath.startsWith('~src/')) {
      imports.push(importPath)
    }
  }

  return imports
}

function detectDependencies(
  workspace: WorkspaceInfo,
  pathToPackageMap: Map<string, string>,
  verbose: boolean,
): string[] {
  const dependencies = new Set<string>()
  const tsFiles = findTsFiles(workspace.path)

  for (const file of tsFiles) {
    const imports = extractImports(file)

    for (const importPath of imports) {
      const workspacePath = importPathToWorkspacePath(importPath)

      if (!workspacePath) {
        continue
      }

      const packageName = pathToPackageMap.get(workspacePath)

      if (!packageName) {
        // Import points to code not in any workspace - ignore
        continue
      }

      // Skip self-imports
      if (packageName === workspace.packageName) {
        continue
      }

      dependencies.add(packageName)

      if (verbose) {
        const relativeFile = relative(ROOT_DIR, file)
        // claude-hooks-ignore-logging-violation
        console.log(`  ${relativeFile}: ${importPath} -> ${packageName}`)
      }
    }
  }

  // Sort alphabetically for deterministic output
  return Array.from(dependencies).sort()
}

function readTurboJson(workspacePath: string): TurboJson {
  const turboJsonPath = join(workspacePath, 'turbo.json')

  if (!existsSync(turboJsonPath)) {
    return {
      $schema: 'https://turbo.build/schema.json',
      extends: ['//'],
      tasks: {
        test: {},
      },
    }
  }

  return JSON.parse(readFileSync(turboJsonPath, 'utf-8')) as TurboJson
}

function updateTurboJson(
  workspace: WorkspaceInfo,
  dependencies: string[],
  dryRun: boolean,
): { changed: boolean; oldDependsOn: string[]; newDependsOn: string[] } {
  const turboJson = readTurboJson(workspace.path)
  const turboJsonPath = join(workspace.path, 'turbo.json')

  // Get existing dependsOn for comparison
  const oldDependsOn = turboJson.tasks?.test?.dependsOn ?? []
  const newDependsOn = dependencies.map((pkg) => `${pkg}#test`)

  // Check if there's a change
  const oldSorted = [...oldDependsOn].sort()
  const newSorted = [...newDependsOn].sort()
  const changed = JSON.stringify(oldSorted) !== JSON.stringify(newSorted)

  if (!changed) {
    return { changed: false, oldDependsOn, newDependsOn }
  }

  // Ensure tasks.test exists
  if (!turboJson.tasks) {
    turboJson.tasks = {}
  }
  if (!turboJson.tasks.test) {
    turboJson.tasks.test = {}
  }

  // Update dependsOn - preserve order by always using sorted array
  if (newDependsOn.length > 0) {
    turboJson.tasks.test.dependsOn = newDependsOn
  } else {
    // Remove dependsOn if empty
    delete turboJson.tasks.test.dependsOn
  }

  if (!dryRun) {
    writeFileSync(turboJsonPath, JSON.stringify(turboJson, null, 2) + '\n')
  }

  return { changed: true, oldDependsOn, newDependsOn }
}

function main(): void {
  const args = parseArgs()

  // claude-hooks-ignore-logging-violation
  console.log('Loading workspaces...')
  const allWorkspaces = loadWorkspaces()
  // claude-hooks-ignore-logging-violation
  console.log(`Found ${allWorkspaces.length} workspaces\n`)

  const pathToPackageMap = buildPathToPackageMap(allWorkspaces)

  // Filter to specific workspace if requested
  let workspaces = allWorkspaces
  if (args.workspace) {
    const normalizedPath = args.workspace.replace(/\/$/, '') // Remove trailing slash
    workspaces = allWorkspaces.filter((w) => w.relativePath === normalizedPath)

    if (workspaces.length === 0) {
      // claude-hooks-ignore-logging-violation
      console.error(`❌ Workspace not found: ${args.workspace}`)
      // claude-hooks-ignore-logging-violation
      console.error('Available workspaces:')
      for (const w of allWorkspaces.slice(0, 10)) {
        // claude-hooks-ignore-logging-violation
        console.error(`  ${w.relativePath}`)
      }
      // claude-hooks-ignore-logging-violation
      console.error(`  ... and ${allWorkspaces.length - 10} more`)
      process.exit(1)
    }
  }

  let changedCount = 0
  let unchangedCount = 0

  for (const workspace of workspaces) {
    if (args.verbose) {
      // claude-hooks-ignore-logging-violation
      console.log(
        `\nScanning ${workspace.relativePath} (${workspace.packageName}):`,
      )
    }

    const dependencies = detectDependencies(
      workspace,
      pathToPackageMap,
      args.verbose,
    )
    const { changed, oldDependsOn, newDependsOn } = updateTurboJson(
      workspace,
      dependencies,
      args.dryRun,
    )

    if (changed) {
      changedCount++
      // claude-hooks-ignore-logging-violation
      console.log(
        `${args.dryRun ? '[DRY-RUN] Would update' : 'Updated'}: ${workspace.relativePath}/turbo.json`,
      )

      if (args.verbose || args.dryRun) {
        // Show the diff
        const removed = oldDependsOn.filter((d) => !newDependsOn.includes(d))
        const added = newDependsOn.filter((d) => !oldDependsOn.includes(d))

        for (const dep of removed) {
          // claude-hooks-ignore-logging-violation
          console.log(`  - ${dep}`)
        }
        for (const dep of added) {
          // claude-hooks-ignore-logging-violation
          console.log(`  + ${dep}`)
        }
      }
    } else {
      unchangedCount++
      if (args.verbose) {
        // claude-hooks-ignore-logging-violation
        console.log(`No changes: ${workspace.relativePath}/turbo.json`)
      }
    }
  }

  // claude-hooks-ignore-logging-violation
  console.log(
    `\n✅ ${args.dryRun ? 'Would update' : 'Updated'} ${changedCount} workspace(s)`,
  )
  // claude-hooks-ignore-logging-violation
  console.log(`   ${unchangedCount} workspace(s) unchanged`)

  if (args.dryRun && changedCount > 0) {
    // claude-hooks-ignore-logging-violation
    console.log('\nRun without --dry-run to apply changes')
  }
}

main()
