import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useCreateGame } from '~src/services/ticTacToe/hooks/useCreateGame'
import { useGame } from '~src/services/ticTacToe/hooks/useGame'
import { useMakeMove } from '~src/services/ticTacToe/hooks/useMakeMove'
import { GameBoard } from '~src/services/ticTacToe/components/GameBoard'
import { GameStatusDisplay } from '~src/services/ticTacToe/components/GameStatusDisplay'

const useCurrentPlayer = (): 'X' | 'O' => {
  const [searchParams] = useSearchParams()
  const player = searchParams.get('player')
  return player === 'O' ? 'O' : 'X'
}

const GameView = ({ gameId }: { gameId: string }) => {
  const currentPlayer = useCurrentPlayer()
  const { data, isLoading } = useGame(gameId)
  const makeMove = useMakeMove(gameId)

  if (isLoading || data == null) {
    return <div className="text-center text-gray-500">Loading game...</div>
  }

  const { aggregate } = data

  return (
    <div className="flex flex-col items-center gap-6">
      <GameStatusDisplay aggregate={aggregate} currentPlayer={currentPlayer} />
      <GameBoard
        aggregate={aggregate}
        currentPlayer={currentPlayer}
        onCellClick={(row, column) => {
          makeMove.mutate({ player: aggregate.currentTurn, row, column })
        }}
      />
    </div>
  )
}

export const TicTacToePage = () => {
  const { gameId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const createGame = useCreateGame()

  const handleNewGame = () => {
    createGame.mutate(undefined, {
      onSuccess: (data) => {
        const player = searchParams.get('player')
        const query = player != null ? `?player=${player}` : ''
        navigate(`/tic-tac-toe/${data.aggregate.id}${query}`)
      },
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8">Tic-Tac-Toe</h1>

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
