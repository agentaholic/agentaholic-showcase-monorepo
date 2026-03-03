import { useNavigate, useParams } from 'react-router'
import { useCreateRound } from '~src/services/hangman/hooks/useCreateRound'
import { useRound } from '~src/services/hangman/hooks/useRound'
import { useGuessLetter } from '~src/services/hangman/hooks/useGuessLetter'
import { HangmanDrawing } from '~src/services/hangman/components/HangmanDrawing'
import { WordDisplay } from '~src/services/hangman/components/WordDisplay'
import { LetterButtons } from '~src/services/hangman/components/LetterButtons'
import { RoundStatusDisplay } from '~src/services/hangman/components/RoundStatusDisplay'

const RoundView = ({ roundId }: { roundId: string }) => {
  const { data, isLoading } = useRound(roundId)
  const guessLetter = useGuessLetter(roundId)

  if (isLoading || data == null) {
    return <div className="text-center text-gray-500">Loading round...</div>
  }

  const { aggregate } = data

  return (
    <div className="flex flex-col items-center gap-6">
      <RoundStatusDisplay aggregate={aggregate} />
      <HangmanDrawing aggregate={aggregate} />
      <WordDisplay maskedWord={aggregate.maskedWord} />
      <LetterButtons
        aggregate={aggregate}
        onGuess={(letter) => {
          guessLetter.mutate({ letter })
        }}
      />
    </div>
  )
}

export const HangmanPage = () => {
  const { roundId } = useParams()
  const navigate = useNavigate()
  const createRound = useCreateRound()

  const handleNewRound = () => {
    createRound.mutate(undefined, {
      onSuccess: (data) => {
        navigate(`/hangman/${data.aggregate.id}`)
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">Hangman</h1>

      <button
        data-testid="new-round-button"
        onClick={handleNewRound}
        disabled={createRound.isPending}
        className="mb-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {createRound.isPending ? 'Creating...' : 'New Round'}
      </button>

      {roundId != null && <RoundView roundId={roundId} />}
    </div>
  )
}
