import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'

type LetterButtonsProps = {
  aggregate: RoundAggregate
  onGuess: (letter: string) => void
}

export const LetterButtons = ({ aggregate, onGuess }: LetterButtonsProps) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('')
  const isGameOver = aggregate.status !== 'inProgress'
  const revealedLetters = aggregate.maskedWord
    .filter((letter): letter is string => letter !== null)
    .map((letter) => letter.toLowerCase())

  return (
    <div data-testid="letter-buttons" className="grid grid-cols-9 gap-2">
      {alphabet.map((letter) => {
        const isGuessed = aggregate.guessedLetters.includes(letter)
        const isIncorrect = aggregate.incorrectGuesses.includes(letter)
        const isCorrect = isGuessed && revealedLetters.includes(letter)

        let colorClass = 'bg-gray-200 hover:bg-gray-300 text-gray-800'
        if (isIncorrect)
          colorClass = 'bg-red-300 text-red-900 cursor-not-allowed'
        else if (isCorrect)
          colorClass = 'bg-green-300 text-green-900 cursor-not-allowed'

        return (
          <button
            key={letter}
            data-testid={`letter-button-${letter}`}
            onClick={() => {
              onGuess(letter)
            }}
            disabled={isGuessed || isGameOver}
            className={`px-2 py-2 rounded font-bold uppercase text-sm transition-colors disabled:opacity-70 ${colorClass}`}
          >
            {letter}
          </button>
        )
      })}
    </div>
  )
}
