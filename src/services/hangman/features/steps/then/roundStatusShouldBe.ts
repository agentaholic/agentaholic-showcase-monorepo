/* v8 ignore start */
import { expect } from 'vitest'
import { Then } from '~src/utils/testing/bddSteps'
import { getRound } from '~src/services/hangman/api/getRound'
import { currentRoundId } from '~src/services/hangman/features/roundTestContext'

Then(/the round status should be "([^"]+)"$/, async ({ params, scenario }) => {
  const [, expectedStatus] = params

  const result = await getRound({
    id: currentRoundId(),
    namespaceSlug: scenario.id,
  })

  expect(result.aggregate.status).toBe(expectedStatus)
})
