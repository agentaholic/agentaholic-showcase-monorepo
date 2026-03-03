import type { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'

type GameStatusDisplayProps = {
  aggregate: GameAggregate
  currentPlayer: 'X' | 'O'
}

export const GameStatusDisplay = ({
  aggregate,
  currentPlayer,
}: GameStatusDisplayProps) => {
  if (aggregate.status === 'won') {
    const isWinner = aggregate.winner === currentPlayer
    return (
      <div
        data-testid="game-status"
        className="text-center text-xl font-semibold"
      >
        {isWinner ? (
          <span className="text-green-600">You win! 🎉</span>
        ) : (
          <span className="text-red-600">Player {aggregate.winner} wins!</span>
        )}
      </div>
    )
  }

  if (aggregate.status === 'drawn') {
    return (
      <div
        data-testid="game-status"
        className="text-center text-xl font-semibold text-gray-600"
      >
        It's a draw!
      </div>
    )
  }

  const isMyTurn = aggregate.currentTurn === currentPlayer
  return (
    <div
      data-testid="game-status"
      className="text-center text-lg text-gray-700"
    >
      {isMyTurn ? (
        <span className="font-semibold text-blue-600">
          Your turn ({currentPlayer})
        </span>
      ) : (
        <span>Waiting for player {aggregate.currentTurn}...</span>
      )}
    </div>
  )
}
