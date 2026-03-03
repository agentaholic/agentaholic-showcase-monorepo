import { describe, it, expect } from 'vitest'
import { generateId } from '~src/utils/id/generateId'

describe('generateId', () => {
  it('should generate unique random identifiers', () => {
    const id1 = generateId({ mode: 'random' })
    const id2 = generateId({ mode: 'random' })

    expect(id1).toBeDefined()
    expect(id2).toBeDefined()
    expect(id1).not.toBe(id2)
    expect(typeof id1).toBe('string')
    expect(typeof id2).toBe('string')
  })

  it('should generate non-empty strings', () => {
    const id = generateId({ mode: 'random' })

    expect(id.length).toBeGreaterThan(0)
  })

  it('should generate deterministic identifiers', () => {
    const id1 = generateId({ mode: 'deterministic', input: 'test' })
    const id2 = generateId({ mode: 'deterministic', input: 'test' })

    expect(id1).toBe(id2)
    expect(typeof id1).toBe('string')
    expect(id1.length).toBeGreaterThan(0)
  })
})
