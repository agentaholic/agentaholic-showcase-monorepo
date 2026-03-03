import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'

type RoundStatusDisplayProps = {
  aggregate: RoundAggregate
}

export const RoundStatusDisplay = ({ aggregate }: RoundStatusDisplayProps) => {
  if (aggregate.status === 'won') {
    return (
      <p
        data-testid="round-status"
        className="text-2xl font-bold text-green-600"
      >
        You won!
      </p>
    )
  }

  if (aggregate.status === 'lost') {
    return (
      <p data-testid="round-status" className="text-2xl font-bold text-red-600">
        You lost! The word was: {aggregate.word}
      </p>
    )
  }

  return (
    <p data-testid="round-status" className="text-lg text-gray-700">
      Guess a letter! ({aggregate.incorrectGuesses.length} /{' '}
      {aggregate.maxIncorrectGuesses} incorrect)
    </p>
  )
}
