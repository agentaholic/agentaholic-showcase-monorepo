/* v8 ignore start */
import { expect } from 'vitest'
import { Then } from '~src/utils/testing/bddSteps'
import { getRound } from '~src/services/hangman/api/getRound'
import { currentRoundId } from '~src/services/hangman/features/roundTestContext'

Then(/the masked word should be all hidden$/, async ({ scenario }) => {
  const result = await getRound({
    id: currentRoundId(),
    namespaceSlug: scenario.id,
  })

  const allHidden = result.aggregate.maskedWord.every(
    (letter) => letter === null,
  )
  expect(allHidden).toBe(true)
})

Then(/the masked word should have revealed letters$/, async ({ scenario }) => {
  const result = await getRound({
    id: currentRoundId(),
    namespaceSlug: scenario.id,
  })

  const hasRevealed = result.aggregate.maskedWord.some(
    (letter) => letter !== null,
  )
  expect(hasRevealed).toBe(true)
})
