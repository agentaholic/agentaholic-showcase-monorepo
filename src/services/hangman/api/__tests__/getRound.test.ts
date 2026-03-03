import { describe, it, expect, afterEach } from 'vitest'
import { APIError } from 'encore.dev/api'
import { events } from '~encore/clients'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import type { RoundStartedEvent } from '~src/services/hangman/aggregates/Round/events/RoundStarted/RoundStartedEvent'
import { createRound } from '~src/services/hangman/api/createRound'
import { getRound } from '~src/services/hangman/api/getRound'
import { guessLetter } from '~src/services/hangman/api/guessLetter'

describe('getRound', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should return aggregate when round exists', async () => {
    const { aggregate: created } = await createRound({
      namespaceSlug: testNamespace.slug,
    })

    const result = await getRound({
      id: created.id,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.id).toBe(created.id)
  })

  it('should hide word (empty string) when status is inProgress', async () => {
    const { aggregate: created } = await createRound({
      namespaceSlug: testNamespace.slug,
    })

    const result = await getRound({
      id: created.id,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('inProgress')
    expect(result.aggregate.word).toBe('')
  })

  it('should reveal word when status is won', async () => {
    const round = { id: generateId({ mode: 'random' }) }
    const startEvent: RoundStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'RoundStarted',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { word: 'hi' },
    }
    await events.commitTransaction({
      events: [startEvent],
      namespace: testNamespace,
    })

    await guessLetter({ round, letter: 'h', namespaceSlug: testNamespace.slug })
    await guessLetter({ round, letter: 'i', namespaceSlug: testNamespace.slug })

    const result = await getRound({
      id: round.id,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('won')
    expect(result.aggregate.word).toBe('hi')
  })

  it('should reveal word when status is lost', async () => {
    const round = { id: generateId({ mode: 'random' }) }
    const startEvent: RoundStartedEvent = {
      id: generateId({ mode: 'random' }),
      name: 'RoundStarted',
      version: 1,
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { word: 'apple' },
    }
    await events.commitTransaction({
      events: [startEvent],
      namespace: testNamespace,
    })

    for (const letter of ['z', 'x', 'q', 'j', 'v', 'w']) {
      await guessLetter({ round, letter, namespaceSlug: testNamespace.slug })
    }

    const result = await getRound({
      id: round.id,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('lost')
    expect(result.aggregate.word).toBe('apple')
  })

  it('should throw NotFound for nonexistent ID', async () => {
    await expect(
      getRound({
        id: generateId({ mode: 'random' }),
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })
})
