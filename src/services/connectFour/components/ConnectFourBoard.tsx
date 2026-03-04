import type { GameAggregate } from '~src/services/connectFour/aggregates/Game/types/GameAggregate'
import { ConnectFourCell } from '~src/services/connectFour/components/ConnectFourCell'

type ConnectFourBoardProps = {
  aggregate: GameAggregate
  currentPlayer: 'Red' | 'Yellow'
  onColumnClick: (column: number) => void
}

export const ConnectFourBoard = ({
  aggregate,
  currentPlayer,
  onColumnClick,
}: ConnectFourBoardProps) => {
  const isGameOver = aggregate.status !== 'inProgress'
  const isMyTurn = aggregate.currentTurn === currentPlayer

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 7 }, (_, col) => (
          <button
            key={col}
            data-testid={`column-drop-${col}`}
            onClick={() => {
              onColumnClick(col)
            }}
            disabled={isGameOver || !isMyTurn}
            className="w-16 h-8 bg-blue-600 text-white text-sm font-bold rounded-t hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Drop
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 bg-blue-800 p-2 rounded-lg">
        {aggregate.board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <ConnectFourCell
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              row={rowIndex}
              col={colIndex}
            />
          )),
        )}
      </div>
    </div>
  )
}
