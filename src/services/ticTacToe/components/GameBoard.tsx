import type { GameAggregate } from '~src/services/ticTacToe/aggregates/Game/types/GameAggregate'
import { GameCell } from '~src/services/ticTacToe/components/GameCell'

type GameBoardProps = {
  aggregate: GameAggregate
  currentPlayer: 'X' | 'O'
  onCellClick: (row: number, column: number) => void
}

export const GameBoard = ({
  aggregate,
  currentPlayer,
  onCellClick,
}: GameBoardProps) => {
  const isGameOver = aggregate.status !== 'inProgress'
  const isMyTurn = aggregate.currentTurn === currentPlayer

  return (
    <div className="grid grid-cols-3 gap-1">
      {aggregate.board.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <GameCell
            key={`${rowIndex}-${colIndex}`}
            value={cell}
            onClick={() => {
              onCellClick(rowIndex, colIndex)
            }}
            disabled={isGameOver || !isMyTurn}
            row={rowIndex}
            col={colIndex}
          />
        )),
      )}
    </div>
  )
}
