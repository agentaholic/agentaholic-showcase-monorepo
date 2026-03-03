import { describe, it, expect } from 'vitest'
import { convertIdToBytes16 } from '~src/utils/id/convertIdToBytes16'
import { convertId } from '~src/utils/id/convertId'

describe('convertIdToBytes16', () => {
  it('should convert flickrBase58 ID to bytes16 format', () => {
    // Use a known UUID
    const uuid = '550e8400-e29b-41d4-a716-446655440000'

    // Convert to flickrBase58
    const flickrBase58Id = convertId({
      from: 'uuid',
      to: 'flickrBase58',
      value: uuid,
    })

    // Convert to bytes16
    const bytes16 = convertIdToBytes16({ id: flickrBase58Id })

    // Expected: UUID without hyphens, with 0x prefix
    const expected = `0x${uuid.replace(/-/g, '')}`

    expect(bytes16).toBe(expected)
    expect(bytes16).toMatch(/^0x[0-9a-f]{32}$/)
  })

  it('should produce valid bytes16 format (0x followed by 32 hex chars)', () => {
    const flickrBase58Id = convertId({
      from: 'uuid',
      to: 'flickrBase58',
      value: '123e4567-e89b-12d3-a456-426614174000',
    })

    const bytes16 = convertIdToBytes16({ id: flickrBase58Id })

    // Bytes16 should be 0x + 32 hex characters (16 bytes)
    expect(bytes16).toMatch(/^0x[0-9a-f]{32}$/)
    expect(bytes16.length).toBe(34) // 0x + 32 hex chars = 34 chars total
  })

  it('should be reversible (bytes16 -> UUID -> flickrBase58)', () => {
    const originalFlickrBase58 = convertId({
      from: 'uuid',
      to: 'flickrBase58',
      value: '550e8400-e29b-41d4-a716-446655440000',
    })

    const bytes16 = convertIdToBytes16({ id: originalFlickrBase58 })

    // Remove 0x prefix and add hyphens back to get UUID
    const hexWithoutPrefix = bytes16.slice(2)
    const reconstructedUuid = [
      hexWithoutPrefix.slice(0, 8),
      hexWithoutPrefix.slice(8, 12),
      hexWithoutPrefix.slice(12, 16),
      hexWithoutPrefix.slice(16, 20),
      hexWithoutPrefix.slice(20, 32),
    ].join('-')

    // Convert back to flickrBase58
    const reconstructedFlickrBase58 = convertId({
      from: 'uuid',
      to: 'flickrBase58',
      value: reconstructedUuid,
    })

    expect(reconstructedFlickrBase58).toBe(originalFlickrBase58)
  })

  it('should handle different UUIDs consistently', () => {
    const testUuids = [
      '00000000-0000-0000-0000-000000000000',
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      '123e4567-e89b-12d3-a456-426614174000',
    ]

    testUuids.forEach((uuid) => {
      const flickrBase58 = convertId({
        from: 'uuid',
        to: 'flickrBase58',
        value: uuid,
      })

      const bytes16 = convertIdToBytes16({ id: flickrBase58 })

      expect(bytes16).toBe(`0x${uuid.replace(/-/g, '')}`)
    })
  })
})
