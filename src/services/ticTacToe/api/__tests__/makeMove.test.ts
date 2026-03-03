import { describe, it, expect, afterEach } from 'vitest'
import { APIError } from 'encore.dev/api'
import { eventsDatabase } from '~src/services/events/database/eventsDatabase'
import { convertImportMetaUrlToKebabSlug } from '~src/utils/url/convertImportMetaUrlToKebabSlug'
import { generateId } from '~src/utils/id/generateId'
import { createGame } from '~src/services/ticTacToe/api/createGame'
import { makeMove } from '~src/services/ticTacToe/api/makeMove'

describe('makeMove', () => {
  const testNamespace = {
    slug: convertImportMetaUrlToKebabSlug(import.meta.url),
  }

  afterEach(async () => {
    await eventsDatabase.exec`DELETE FROM events WHERE namespace_slug = ${testNamespace.slug}`
  })

  it('should make a valid move and return updated aggregate', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    const result = await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 0,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.board[0][0]).toBe('X')
    expect(result.aggregate.currentTurn).toBe('O')
    expect(result.aggregate.moves).toEqual([{ player: 'X', row: 0, column: 0 }])
  })

  it('should throw NotFound when game does not exist', async () => {
    await expect(
      makeMove({
        game: { id: generateId({ mode: 'random' }) },
        player: 'X',
        row: 0,
        column: 0,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })

  it('should throw FailedPrecondition when it is not the player turn', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    await expect(
      makeMove({
        game: { id: created.id },
        player: 'O',
        row: 0,
        column: 0,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })

  it('should throw FailedPrecondition for invalid coordinates', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    await expect(
      makeMove({
        game: { id: created.id },
        player: 'X',
        row: 3,
        column: 0,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })

  it('should throw FailedPrecondition when cell is occupied', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 0,
      namespaceSlug: testNamespace.slug,
    })

    await expect(
      makeMove({
        game: { id: created.id },
        player: 'O',
        row: 0,
        column: 0,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })

  it('should detect a win (X wins with top row)', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    // X: (0,0), O: (1,0), X: (0,1), O: (1,1), X: (0,2) -> X wins
    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'O',
      row: 1,
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 1,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'O',
      row: 1,
      column: 1,
      namespaceSlug: testNamespace.slug,
    })

    const result = await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 2,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('won')
    expect(result.aggregate.winner).toBe('X')
  })

  it('should detect a draw', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    // Play a game that ends in a draw:
    // X O X
    // X X O
    // O X O
    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'O',
      row: 0,
      column: 1,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 2,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'O',
      row: 1,
      column: 2,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 1,
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'O',
      row: 2,
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 1,
      column: 1,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'O',
      row: 2,
      column: 2,
      namespaceSlug: testNamespace.slug,
    })

    const result = await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 2,
      column: 1,
      namespaceSlug: testNamespace.slug,
    })

    expect(result.aggregate.status).toBe('drawn')
  })

  it('should not allow moves after a game is won', async () => {
    const { aggregate: created } = await createGame({
      namespaceSlug: testNamespace.slug,
    })

    // X wins with top row
    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'O',
      row: 1,
      column: 0,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 1,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'O',
      row: 1,
      column: 1,
      namespaceSlug: testNamespace.slug,
    })
    await makeMove({
      game: { id: created.id },
      player: 'X',
      row: 0,
      column: 2,
      namespaceSlug: testNamespace.slug,
    })

    await expect(
      makeMove({
        game: { id: created.id },
        player: 'O',
        row: 2,
        column: 0,
        namespaceSlug: testNamespace.slug,
      }),
    ).rejects.toThrow(APIError)
  })
})
