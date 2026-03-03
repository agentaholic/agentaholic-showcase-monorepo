import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'

type HangmanDrawingProps = {
  aggregate: RoundAggregate
}

export const HangmanDrawing = ({ aggregate }: HangmanDrawingProps) => {
  const errors = aggregate.incorrectGuesses.length

  return (
    <svg
      data-testid="hangman-drawing"
      width="200"
      height="250"
      className="stroke-gray-800"
      strokeWidth="4"
      strokeLinecap="round"
    >
      {/* Gallows */}
      <line x1="20" y1="240" x2="180" y2="240" /> {/* base */}
      <line x1="60" y1="240" x2="60" y2="20" /> {/* pole */}
      <line x1="60" y1="20" x2="130" y2="20" /> {/* beam */}
      <line x1="130" y1="20" x2="130" y2="50" /> {/* rope */}
      {/* Head */}
      {errors >= 1 && <circle cx="130" cy="70" r="20" fill="none" />}
      {/* Body */}
      {errors >= 2 && <line x1="130" y1="90" x2="130" y2="150" />}
      {/* Left arm */}
      {errors >= 3 && <line x1="130" y1="110" x2="100" y2="140" />}
      {/* Right arm */}
      {errors >= 4 && <line x1="130" y1="110" x2="160" y2="140" />}
      {/* Left leg */}
      {errors >= 5 && <line x1="130" y1="150" x2="100" y2="190" />}
      {/* Right leg */}
      {errors >= 6 && <line x1="130" y1="150" x2="160" y2="190" />}
    </svg>
  )
}
