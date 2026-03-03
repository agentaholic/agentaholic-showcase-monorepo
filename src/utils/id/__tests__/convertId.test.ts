import { describe, it, expect } from 'vitest'
import { convertId } from '~src/utils/id/convertId'

describe('convertId', () => {
  const sampleUuid = '550e8400-e29b-41d4-a716-446655440000'

  // Generate a valid flickrBase58 from the sample UUID
  const sampleFlickrBase58 = convertId({
    from: 'uuid',
    to: 'flickrBase58',
    value: sampleUuid,
  })

  describe('UUID to flickrBase58 conversion', () => {
    it('should convert UUID to flickrBase58 format', () => {
      const result = convertId({
        from: 'uuid',
        to: 'flickrBase58',
        value: sampleUuid,
      })

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    it('should produce consistent results for the same UUID', () => {
      const result1 = convertId({
        from: 'uuid',
        to: 'flickrBase58',
        value: sampleUuid,
      })
      const result2 = convertId({
        from: 'uuid',
        to: 'flickrBase58',
        value: sampleUuid,
      })

      expect(result1).toBe(result2)
    })
  })

  describe('flickrBase58 to UUID conversion', () => {
    it('should convert flickrBase58 to UUID format', () => {
      const result = convertId({
        from: 'flickrBase58',
        to: 'uuid',
        value: sampleFlickrBase58,
      })

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
      expect(result).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    })

    it('should produce consistent results for the same flickrBase58', () => {
      const result1 = convertId({
        from: 'flickrBase58',
        to: 'uuid',
        value: sampleFlickrBase58,
      })
      const result2 = convertId({
        from: 'flickrBase58',
        to: 'uuid',
        value: sampleFlickrBase58,
      })

      expect(result1).toBe(result2)
    })
  })

  describe('round-trip conversion', () => {
    it('should maintain data integrity when converting UUID -> flickrBase58 -> UUID', () => {
      const originalUuid = sampleUuid

      const flickrBase58 = convertId({
        from: 'uuid',
        to: 'flickrBase58',
        value: originalUuid,
      })

      const backToUuid = convertId({
        from: 'flickrBase58',
        to: 'uuid',
        value: flickrBase58,
      })

      expect(backToUuid.toLowerCase()).toBe(originalUuid.toLowerCase())
    })

    it('should maintain data integrity when converting flickrBase58 -> UUID -> flickrBase58', () => {
      const originalFlickrBase58 = sampleFlickrBase58

      const uuid = convertId({
        from: 'flickrBase58',
        to: 'uuid',
        value: originalFlickrBase58,
      })

      const backToFlickrBase58 = convertId({
        from: 'uuid',
        to: 'flickrBase58',
        value: uuid,
      })

      expect(backToFlickrBase58).toBe(originalFlickrBase58)
    })
  })

  describe('edge cases', () => {
    it('should handle different UUID formats', () => {
      const uuidUppercase = sampleUuid.toUpperCase()
      const result = convertId({
        from: 'uuid',
        to: 'flickrBase58',
        value: uuidUppercase,
      })

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })
})
