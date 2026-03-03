import { describe, expect, it } from 'vitest'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'

describe('convertImportMetaUrlToKebabSlug', () => {
  it('should convert simple test file names to kebab-case', () => {
    const url = 'file:///path/to/commitTransaction.test.ts'
    const result = convertImportMetaUrlToKebabSlug(url)
    expect(result).toBe('commit-transaction')
  })

  it('should handle camelCase file names with OAuth2', () => {
    const url = 'file:///path/to/getGoogleOAuth2CredentialsToken.test.ts'
    const result = convertImportMetaUrlToKebabSlug(url)
    expect(result).toBe('get-google-o-auth2-credentials-token')
  })

  it('should handle PascalCase file names', () => {
    const url = 'file:///path/to/CreateUserAccount.test.ts'
    const result = convertImportMetaUrlToKebabSlug(url)
    expect(result).toBe('create-user-account')
  })

  it('should handle single word file names', () => {
    const url = 'file:///path/to/user.test.ts'
    const result = convertImportMetaUrlToKebabSlug(url)
    expect(result).toBe('user')
  })

  it('should handle files with multiple dots in path', () => {
    const url = 'file:///path/to/some.service.module.test.ts'
    const result = convertImportMetaUrlToKebabSlug(url)
    expect(result).toBe('some-service-module')
  })

  it('should handle already kebab-case file names', () => {
    const url = 'file:///path/to/load-aggregate.test.ts'
    const result = convertImportMetaUrlToKebabSlug(url)
    expect(result).toBe('load-aggregate')
  })

  it('should handle Windows-style paths', () => {
    const url = 'file:///C:/path/to/loadAggregate.test.ts'
    const result = convertImportMetaUrlToKebabSlug(url)
    expect(result).toBe('load-aggregate')
  })

  it('should handle long nested paths', () => {
    const url = 'file:///very/long/nested/path/to/someComplexFileName.test.ts'
    const result = convertImportMetaUrlToKebabSlug(url)
    expect(result).toBe('some-complex-file-name')
  })

  it('should handle real project file names', () => {
    const url = 'file:///path/to/createGoogleOAuth2CredentialsToken.test.ts'
    const result = convertImportMetaUrlToKebabSlug(url)
    expect(result).toBe('create-google-o-auth2-credentials-token')
  })
})
