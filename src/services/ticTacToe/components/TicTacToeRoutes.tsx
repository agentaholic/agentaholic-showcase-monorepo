import { Route } from 'react-router'
import { TicTacToePage } from '../pages/TicTacToePage'

export const TicTacToeRoutes = () => (
  <>
    <Route path="/tic-tac-toe" element={<TicTacToePage />} />
    <Route path="/tic-tac-toe/:gameId" element={<TicTacToePage />} />
  </>
)
