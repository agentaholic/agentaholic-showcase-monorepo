import { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'
import { GameEvent } from '~src/services/ticTacToe/aggregates/Game/GameEvent'
import { onGameStarted } from '~src/services/ticTacToe/aggregates/Game/events/GameStarted/onGameStarted'
import { onMoveMade } from '~src/services/ticTacToe/aggregates/Game/events/MoveMade/onMoveMade'
import { onGameWon } from '~src/services/ticTacToe/aggregates/Game/events/GameWon/onGameWon'
import { onGameDrawn } from '~src/services/ticTacToe/aggregates/Game/events/GameDrawn/onGameDrawn'
// DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new imports

export const gameAggregateReducer = (
  aggregate: GameAggregate | null,
  event: GameEvent,
): GameAggregate | null => {
  switch (event.name) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    case 'GameStarted':
      return onGameStarted(aggregate, event)

    case 'MoveMade':
      return onMoveMade(aggregate, event)

    case 'GameWon':
      return onGameWon(aggregate, event)

    case 'GameDrawn':
      return onGameDrawn(aggregate, event)

    // DO NOT DELETE THIS LINE: this comment indicates where hygen will insert new event handlers
  }
}
