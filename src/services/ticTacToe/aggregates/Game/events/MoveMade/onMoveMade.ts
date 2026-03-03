import type { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'
import type { MoveMadeEvent } from '~src/services/ticTacToe/aggregates/Game/events/MoveMade/MoveMadeEvent'

export const onMoveMade = (
  aggregate: GameAggregate | null,
  event: MoveMadeEvent,
): GameAggregate | null => {
  /* v8 ignore next 3 */
  if (aggregate == null) {
    return null
  }

  const { player, row, column } = event.data

  const newBoard = aggregate.board.map((boardRow) => [...boardRow])
  newBoard[row][column] = player

  const nextTurn = player === 'X' ? 'O' : 'X'

  return {
    ...aggregate,
    board: newBoard,
    currentTurn: nextTurn,
    moves: [...aggregate.moves, { player, row, column }],
  }
}
