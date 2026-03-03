type WordDisplayProps = {
  maskedWord: Array<string | null>
}

export const WordDisplay = ({ maskedWord }: WordDisplayProps) => {
  return (
    <div data-testid="word-display" className="flex gap-2 text-3xl font-mono">
      {maskedWord.map((letter, index) => (
        <span
          key={index}
          className="w-8 text-center border-b-2 border-gray-800 pb-1"
        >
          {letter !== null ? letter.toUpperCase() : '_'}
        </span>
      ))}
    </div>
  )
}
