import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useCreateConnectFourGame } from '~src/services/connectFour/hooks/useCreateConnectFourGame'
import { useConnectFourGame } from '~src/services/connectFour/hooks/useConnectFourGame'
import { useDropDisc } from '~src/services/connectFour/hooks/useDropDisc'
import { ConnectFourBoard } from '~src/services/connectFour/components/ConnectFourBoard'
import { ConnectFourStatusDisplay } from '~src/services/connectFour/components/ConnectFourStatusDisplay'

const useCurrentPlayer = (): 'Red' | 'Yellow' => {
  const [searchParams] = useSearchParams()
  const player = searchParams.get('player')
  return player === 'Yellow' ? 'Yellow' : 'Red'
}

const GameView = ({ gameId }: { gameId: string }) => {
  const currentPlayer = useCurrentPlayer()
  const { data, isLoading } = useConnectFourGame(gameId)
  const dropDisc = useDropDisc(gameId)

  if (isLoading || data == null) {
    return <div className="text-center text-gray-500">Loading game...</div>
  }

  const { aggregate } = data

  return (
    <div className="flex flex-col items-center gap-6">
      <ConnectFourStatusDisplay
        aggregate={aggregate}
        currentPlayer={currentPlayer}
      />
      <ConnectFourBoard
        aggregate={aggregate}
        currentPlayer={currentPlayer}
        onColumnClick={(column) => {
          dropDisc.mutate({ player: aggregate.currentTurn, column })
        }}
      />
    </div>
  )
}

export const ConnectFourPage = () => {
  const { gameId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const createGame = useCreateConnectFourGame()

  const handleNewGame = () => {
    createGame.mutate(undefined, {
      onSuccess: (data) => {
        const player = searchParams.get('player')
        const query = player != null ? `?player=${player}` : ''
        navigate(`/connect-four/${data.aggregate.id}${query}`)
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">Connect Four</h1>

      <button
        data-testid="new-game-button"
        onClick={handleNewGame}
        disabled={createGame.isPending}
        className="mb-8 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {createGame.isPending ? 'Creating...' : 'New Game'}
      </button>

      {gameId != null && <GameView gameId={gameId} />}
    </div>
  )
}
