/* v8 ignore start */
import '~src/test/given/onApp'
import '~src/test/given/onRoute'
import '~src/test/when/click'
import '~src/services/connectFour/features/steps/when/startConnectFourGame'
import '~src/services/connectFour/features/steps/when/dropDiscAs'
import '~src/services/connectFour/features/steps/then/connectFourGameShouldShowStatus'
import { afterEach } from 'vitest'
import { Feature } from '~src/utils/testing/bdd'
import { clearCurrentGameId } from '~src/services/connectFour/features/gameTestContext'
import { Route, Routes } from 'react-router'
import { ConnectFourPage } from '~src/services/connectFour/pages/ConnectFourPage'

afterEach(clearCurrentGameId)

const connectFourRoutes = (
  <Routes>
    <Route path="/connect-four" element={<ConnectFourPage />} />
    <Route path="/connect-four/:gameId" element={<ConnectFourPage />} />
  </Routes>
)

Feature('Connect Four Game', { routes: connectFourRoutes }, ({ Scenario }) => {
  Scenario('A new game can be started', [
    'Given I am on the app',
    'And I am on the "/connect-four" route',
    'When I click "new-game-button"',
    'Then the connect four game status should contain "Your turn"',
  ])

  Scenario('Red wins with a vertical four', [
    'Given I am on the app',
    'And I am on the "/connect-four" route',
    'When I start a new connect four game',
    'And player Red drops disc in column 0',
    'And player Yellow drops disc in column 1',
    'And player Red drops disc in column 0',
    'And player Yellow drops disc in column 1',
    'And player Red drops disc in column 0',
    'And player Yellow drops disc in column 1',
    'And player Red drops disc in column 0',
    'Then the connect four game status should contain "win"',
  ])

  Scenario('Red wins with a horizontal four', [
    'Given I am on the app',
    'And I am on the "/connect-four" route',
    'When I start a new connect four game',
    'And player Red drops disc in column 0',
    'And player Yellow drops disc in column 0',
    'And player Red drops disc in column 1',
    'And player Yellow drops disc in column 1',
    'And player Red drops disc in column 2',
    'And player Yellow drops disc in column 2',
    'And player Red drops disc in column 3',
    'Then the connect four game status should contain "win"',
  ])

  Scenario('The game ends in a draw', [
    'Given I am on the app',
    'And I am on the "/connect-four" route',
    'When I start a new connect four game',
    'And player Red drops disc in column 0',
    'And player Yellow drops disc in column 0',
    'And player Red drops disc in column 0',
    'And player Yellow drops disc in column 0',
    'And player Red drops disc in column 0',
    'And player Yellow drops disc in column 0',
    'And player Red drops disc in column 1',
    'And player Yellow drops disc in column 1',
    'And player Red drops disc in column 1',
    'And player Yellow drops disc in column 1',
    'And player Red drops disc in column 1',
    'And player Yellow drops disc in column 1',
    'And player Red drops disc in column 2',
    'And player Yellow drops disc in column 2',
    'And player Red drops disc in column 2',
    'And player Yellow drops disc in column 2',
    'And player Red drops disc in column 2',
    'And player Yellow drops disc in column 2',
    'And player Red drops disc in column 4',
    'And player Yellow drops disc in column 3',
    'And player Red drops disc in column 3',
    'And player Yellow drops disc in column 3',
    'And player Red drops disc in column 3',
    'And player Yellow drops disc in column 3',
    'And player Red drops disc in column 3',
    'And player Yellow drops disc in column 4',
    'And player Red drops disc in column 4',
    'And player Yellow drops disc in column 4',
    'And player Red drops disc in column 4',
    'And player Yellow drops disc in column 4',
    'And player Red drops disc in column 5',
    'And player Yellow drops disc in column 5',
    'And player Red drops disc in column 5',
    'And player Yellow drops disc in column 5',
    'And player Red drops disc in column 5',
    'And player Yellow drops disc in column 5',
    'And player Red drops disc in column 6',
    'And player Yellow drops disc in column 6',
    'And player Red drops disc in column 6',
    'And player Yellow drops disc in column 6',
    'And player Red drops disc in column 6',
    'And player Yellow drops disc in column 6',
    'Then the connect four game status should contain "draw"',
  ])
})
