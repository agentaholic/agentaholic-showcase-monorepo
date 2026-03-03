/* v8 ignore start */
import { vi } from 'vitest'
import { Given } from '~src/utils/testing/bddSteps'
import { createRound } from '~src/services/hangman/api/createRound'
import {
  setCurrentRoundId,
  setCurrentWord,
} from '~src/services/hangman/features/roundTestContext'

const testWord = 'apple'

vi.mock('~src/services/hangman/utils/pickRandomWord', () => ({
  pickRandomWord: () => testWord,
}))

Given(/a new round is started$/, async ({ scenario }) => {
  const result = await createRound({ namespaceSlug: scenario.id })
  setCurrentRoundId(result.aggregate.id)
  setCurrentWord(testWord)
})
