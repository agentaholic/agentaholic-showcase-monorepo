import type { GameAggregate } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'
import type { GameDiscDroppedEvent } from '~src/services/connectFour/aggregates/Game/events/GameDiscDropped/GameDiscDroppedEvent'

export const onGameDiscDropped = (
  aggregate: GameAggregate | null,
  event: GameDiscDroppedEvent,
): GameAggregate | null => {
  /* v8 ignore next 3 */
  if (aggregate == null) {
    return null
  }

  const { player, row, column } = event.data

  const newBoard = aggregate.board.map((boardRow) => [...boardRow])
  newBoard[row][column] = player

  const nextTurn = player === 'Red' ? 'Yellow' : 'Red'

  return {
    ...aggregate,
    board: newBoard,
    currentTurn: nextTurn,
    moves: [...aggregate.moves, { player, row, column }],
  }
}
