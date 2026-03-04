import { describe, it, expect, afterEach } from 'vitest'
import { APIError } from 'encore.dev/api'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import { createGame } from '~src/services/connectFour/api/createGame'
import { dropDisc } from '~src/services/connectFour/api/dropDisc'

describe('dropDisc', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should drop a disc in column 0 and place it at the bottom row', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    const result = await dropDisc({
      game: { id: created.id },
      player: 'Red',
      column: 0,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.board[5][0]).toBe('Red')
    expect(result.aggregate.currentTurn).toBe('Yellow')
    expect(result.aggregate.status).toBe('inProgress')
  })

  it('should stack discs in the same column', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    await dropDisc({
      game: { id: created.id },
      player: 'Red',
      column: 0,
      namespaceSlug: testNamespace.slug,
    })

    const result = await dropDisc({
      game: { id: created.id },
      player: 'Yellow',
      column: 0,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.board[5][0]).toBe('Red')
    expect(result.aggregate.board[4][0]).toBe('Yellow')
  })

  it('should detect a vertical win for Red', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    // Red drops in column 0, Yellow in column 1, 4 times
    await dropDisc({
      game: { id: created.id },
      player: 'Red',
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await dropDisc({
      game: { id: created.id },
      player: 'Yellow',
      column: 1,
      namespaceSlug: testNamespace.slug,
    })
    await dropDisc({
      game: { id: created.id },
      player: 'Red',
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await dropDisc({
      game: { id: created.id },
      player: 'Yellow',
      column: 1,
      namespaceSlug: testNamespace.slug,
    })
    await dropDisc({
      game: { id: created.id },
      player: 'Red',
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await dropDisc({
      game: { id: created.id },
      player: 'Yellow',
      column: 1,
      namespaceSlug: testNamespace.slug,
    })

    const result = await dropDisc({
      game: { id: created.id },
      player: 'Red',
      column: 0,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('won')
    expect(result.aggregate.winner).toBe('Red')
  })

  it('should detect a draw when the board is full without a winner', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    const gameId = created.id
    const ns = testNamespace.slug

    // This sequence fills all 42 cells without any player getting 4-in-a-row.
    // Generated via backtracking simulation to guarantee no win occurs.
    const drops: Array<{ player: 'Red' | 'Yellow'; column: number }> = [
      { player: 'Red', column: 0 },
      { player: 'Yellow', column: 0 },
      { player: 'Red', column: 0 },
      { player: 'Yellow', column: 0 },
      { player: 'Red', column: 0 },
      { player: 'Yellow', column: 0 },
      { player: 'Red', column: 1 },
      { player: 'Yellow', column: 1 },
      { player: 'Red', column: 1 },
      { player: 'Yellow', column: 1 },
      { player: 'Red', column: 1 },
      { player: 'Yellow', column: 1 },
      { player: 'Red', column: 2 },
      { player: 'Yellow', column: 2 },
      { player: 'Red', column: 2 },
      { player: 'Yellow', column: 2 },
      { player: 'Red', column: 2 },
      { player: 'Yellow', column: 2 },
      { player: 'Red', column: 4 },
      { player: 'Yellow', column: 3 },
      { player: 'Red', column: 3 },
      { player: 'Yellow', column: 3 },
      { player: 'Red', column: 3 },
      { player: 'Yellow', column: 3 },
      { player: 'Red', column: 3 },
      { player: 'Yellow', column: 4 },
      { player: 'Red', column: 4 },
      { player: 'Yellow', column: 4 },
      { player: 'Red', column: 4 },
      { player: 'Yellow', column: 4 },
      { player: 'Red', column: 5 },
      { player: 'Yellow', column: 5 },
      { player: 'Red', column: 5 },
      { player: 'Yellow', column: 5 },
      { player: 'Red', column: 5 },
      { player: 'Yellow', column: 5 },
      { player: 'Red', column: 6 },
      { player: 'Yellow', column: 6 },
      { player: 'Red', column: 6 },
      { player: 'Yellow', column: 6 },
      { player: 'Red', column: 6 },
      { player: 'Yellow', column: 6 },
    ]

    let result = await dropDisc({
      game: { id: gameId },
      player: drops[0].player,
      column: drops[0].column,
      namespaceSlug: ns,
    })

    for (const drop of drops.slice(1)) {
      result = await dropDisc({
        game: { id: gameId },
        player: drop.player,
        column: drop.column,
        namespaceSlug: ns,
      })
    }

    expect(result.aggregate.status).toBe('drawn')
  })

  it('should throw FailedPrecondition when it is not the player turn', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    await expect(
      dropDisc({
        game: { id: created.id },
        player: 'Yellow',
        column: 0,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })

  it('should throw FailedPrecondition for invalid column', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    await expect(
      dropDisc({
        game: { id: created.id },
        player: 'Red',
        column: 7,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)

    await expect(
      dropDisc({
        game: { id: created.id },
        player: 'Red',
        column: -1,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })

  it('should throw FailedPrecondition when column is full', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    // Fill column 0 with 6 discs (alternating Red/Yellow)
    for (let i = 0; i < 3; i++) {
      await dropDisc({
        game: { id: created.id },
        player: 'Red',
        column: 0,
        namespaceSlug: testNamespace.slug,
      })
      await dropDisc({
        game: { id: created.id },
        player: 'Yellow',
        column: 0,
        namespaceSlug: testNamespace.slug,
      })
    }

    await expect(
      dropDisc({
        game: { id: created.id },
        player: 'Red',
        column: 0,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })

  it('should throw FailedPrecondition when game is already won', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    // Red wins vertically in column 0
    for (let i = 0; i < 3; i++) {
      await dropDisc({
        game: { id: created.id },
        player: 'Red',
        column: 0,
        namespaceSlug: testNamespace.slug,
      })
      await dropDisc({
        game: { id: created.id },
        player: 'Yellow',
        column: 1,
        namespaceSlug: testNamespace.slug,
      })
    }
    await dropDisc({
      game: { id: created.id },
      player: 'Red',
      column: 0,
      namespaceSlug: testNamespace.slug,
    })

    await expect(
      dropDisc({
        game: { id: created.id },
        player: 'Yellow',
        column: 2,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })

  it('should throw NotFound when game does not exist', async () => {
    await expect(
      dropDisc({
        game: { id: generateId({ mode: 'random' }) },
        player: 'Red',
        column: 0,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })
})
