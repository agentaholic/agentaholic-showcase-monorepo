/* v8 ignore start */
import '~src/services/hangman/features/steps/given/aNewRound'
import '~src/services/hangman/features/steps/when/guessLetter'
import '~src/services/hangman/features/steps/then/roundStatusShouldBe'
import '~src/services/hangman/features/steps/then/maskedWordShouldBe'
import { afterEach } from 'vitest'
import { Feature } from '~src/utils/testing/bdd'
import { clearCurrentRoundContext } from '~src/services/hangman/features/roundTestContext'

afterEach(clearCurrentRoundContext)

Feature('Hangman Game', ({ Scenario }) => {
  Scenario('A new round can be started', [
    'Given a new round is started',
    'Then the round status should be "inProgress"',
    'And the masked word should be all hidden',
  ])

  Scenario('A correct letter is guessed', [
    'Given a new round is started',
    'When I guess a correct letter',
    'Then the round status should be "inProgress"',
    'And the masked word should have revealed letters',
  ])

  Scenario('The round is won by guessing all letters', [
    'Given a new round is started',
    'When I guess all correct letters',
    'Then the round status should be "won"',
  ])

  Scenario('The round is lost after too many incorrect guesses', [
    'Given a new round is started',
    'When I guess 6 incorrect letters',
    'Then the round status should be "lost"',
  ])
})
