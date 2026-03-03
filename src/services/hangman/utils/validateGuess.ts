import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'

export const validateGuess = (params: {
  aggregate: RoundAggregate
  letter: string
}): { valid: true } | { valid: false; reason: string } => {
  const { aggregate, letter } = params

  if (aggregate.status !== 'inProgress') {
    return { valid: false, reason: 'Round is not in progress' }
  }

  if (letter.length !== 1 || !/^[a-z]$/i.test(letter)) {
    return { valid: false, reason: 'Guess must be a single letter (a-z)' }
  }

  if (aggregate.guessedLetters.includes(letter.toLowerCase())) {
    return { valid: false, reason: 'Letter has already been guessed' }
  }

  return { valid: true }
}
