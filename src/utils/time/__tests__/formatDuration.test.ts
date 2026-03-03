import { describe, expect, it } from 'vitest'
import { formatDuration } from '~src/utils/time/formatDuration'

describe('formatDuration', () => {
  it('returns 0s for zero milliseconds', () => {
    expect(formatDuration(0)).toBe('0s')
  })

  it('returns seconds for durations under a minute', () => {
    expect(formatDuration(34_000)).toBe('34s')
  })

  it('returns minutes and seconds for durations under an hour', () => {
    expect(formatDuration(154_000)).toBe('2m 34s')
  })

  it('omits seconds when duration is exact minutes', () => {
    expect(formatDuration(120_000)).toBe('2m')
  })

  it('returns hours and minutes for durations over an hour', () => {
    expect(formatDuration(4_380_000)).toBe('1h 13m')
  })

  it('omits minutes when duration is exact hours', () => {
    expect(formatDuration(3_600_000)).toBe('1h')
  })

  it('truncates sub-second precision', () => {
    expect(formatDuration(1_500)).toBe('1s')
  })
})
