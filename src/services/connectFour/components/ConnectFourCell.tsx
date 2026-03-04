type ConnectFourCellProps = {
  value: 'Red' | 'Yellow' | null
  row: number
  col: number
}

export const ConnectFourCell = ({ value, row, col }: ConnectFourCellProps) => {
  return (
    <div
      data-testid={`game-cell-${row}-${col}`}
      className="w-16 h-16 bg-blue-700 flex items-center justify-center p-1"
    >
      <div
        className={`w-12 h-12 rounded-full ${
          value === 'Red'
            ? 'bg-red-500'
            : value === 'Yellow'
              ? 'bg-yellow-400'
              : 'bg-white'
        }`}
      />
    </div>
  )
}
