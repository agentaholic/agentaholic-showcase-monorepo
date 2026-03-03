type GameCellProps = {
  value: 'X' | 'O' | null
  onClick: () => void
  disabled: boolean
  row: number
  col: number
}

export const GameCell = ({
  value,
  onClick,
  disabled,
  row,
  col,
}: GameCellProps) => {
  return (
    <button
      data-testid={`game-cell-${row}-${col}`}
      onClick={onClick}
      disabled={disabled || value !== null}
      className="w-24 h-24 border-2 border-gray-400 text-4xl font-bold flex items-center justify-center hover:bg-gray-100 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
    >
      {value === 'X' && <span className="text-blue-600">X</span>}
      {value === 'O' && <span className="text-red-600">O</span>}
    </button>
  )
}
