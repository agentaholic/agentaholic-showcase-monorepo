/* v8 ignore start */
import { When } from '~src/utils/testing/bddSteps'
import { guessLetter } from '~src/services/hangman/api/guessLetter'
import {
  currentRoundId,
  currentWord,
} from '~src/services/hangman/features/roundTestContext'

When(/I guess a correct letter$/, async ({ scenario }) => {
  const word = currentWord()
  const letter = word[0]
  await guessLetter({
    round: { id: currentRoundId() },
    letter,
    namespaceSlug: scenario.id,
  })
})

When(/I guess all correct letters$/, async ({ scenario }) => {
  const word = currentWord()
  const uniqueLetters = [...new Set(word.split(''))]
  for (const letter of uniqueLetters) {
    await guessLetter({
      round: { id: currentRoundId() },
      letter,
      namespaceSlug: scenario.id,
    })
  }
})

When(/I guess (\d+) incorrect letters$/, async ({ params, scenario }) => {
  const [, countString] = params
  const count = Number(countString)
  const word = currentWord()
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  const incorrectLetters = alphabet
    .split('')
    .filter((letter) => !word.includes(letter))

  for (let i = 0; i < count; i++) {
    await guessLetter({
      round: { id: currentRoundId() },
      letter: incorrectLetters[i],
      namespaceSlug: scenario.id,
    })
  }
})
