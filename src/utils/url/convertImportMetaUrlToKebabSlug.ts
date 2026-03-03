import { basename } from 'path'

/**
 * Converts import.meta.url to a kebab-case slug for use as a namespace slug in tests.
 *
 * @param importMetaUrl - The import.meta.url value from the test file
 * @returns A kebab-case slug derived from the file path
 *
 * @example
 * // For a file at "src/services/events/api/commitTransaction.test.ts"
 * convertImportMetaUrlToKebabSlug(import.meta.url)
 * // Returns: "commit-transaction"
 */
export const convertImportMetaUrlToKebabSlug = (
  importMetaUrl: string,
): string => {
  // Convert file:// URL to path and get just the filename without extension
  const url = new URL(importMetaUrl)
  const filename = basename(url.pathname, '.ts')

  // Convert camelCase/PascalCase to kebab-case and remove "test" suffix if present
  return filename
    .replace(/\.test$/, '') // Remove .test suffix if present
    .replace(/\./g, '-') // Replace dots with hyphens
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // Convert camelCase to kebab-case (handles numbers too)
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2') // Handle consecutive uppercase letters like "OAuth2Credentials"
    .toLowerCase()
}
