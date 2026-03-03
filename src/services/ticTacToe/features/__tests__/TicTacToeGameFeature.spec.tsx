/* v8 ignore start */
import '~src/test/given/onApp'
import '~src/test/given/onRoute'
import '~src/test/when/click'
import '~src/services/ticTacToe/features/steps/when/startGame'
import '~src/services/ticTacToe/features/steps/when/makeMoveAs'
import '~src/services/ticTacToe/features/steps/then/gameShouldShowStatus'
import { afterEach } from 'vitest'
import { Feature } from '~src/utils/testing/bdd'
import { clearCurrentGameId } from '~src/services/ticTacToe/features/gameTestContext'
import { Route, Routes } from 'react-router'
import { TicTacToePage } from '~src/services/ticTacToe/pages/TicTacToePage'

afterEach(clearCurrentGameId)

const ticTacToeRoutes = (
  <Routes>
    <Route path="/tic-tac-toe" element={<TicTacToePage />} />
    <Route path="/tic-tac-toe/:gameId" element={<TicTacToePage />} />
  </Routes>
)

Feature('Tic-Tac-Toe Game', { routes: ticTacToeRoutes }, ({ Scenario }) => {
  Scenario('A new game can be started', [
    'Given I am on the app',
    'And I am on the "/tic-tac-toe" route',
    'When I click "new-game-button"',
    'Then the game status should contain "Your turn"',
  ])

  Scenario('X wins with the top row', [
    'Given I am on the app',
    'And I am on the "/tic-tac-toe" route',
    'When I start a new game',
    'And player X moves to cell (0, 0)',
    'And player O moves to cell (1, 0)',
    'And player X moves to cell (0, 1)',
    'And player O moves to cell (1, 1)',
    'And player X moves to cell (0, 2)',
    'Then the game status should contain "win"',
  ])

  Scenario('The game ends in a draw', [
    'Given I am on the app',
    'And I am on the "/tic-tac-toe" route',
    'When I start a new game',
    'And player X moves to cell (0, 0)',
    'And player O moves to cell (0, 1)',
    'And player X moves to cell (0, 2)',
    'And player O moves to cell (1, 2)',
    'And player X moves to cell (1, 0)',
    'And player O moves to cell (2, 0)',
    'And player X moves to cell (1, 1)',
    'And player O moves to cell (2, 2)',
    'And player X moves to cell (2, 1)',
    'Then the game status should contain "draw"',
  ])
})
