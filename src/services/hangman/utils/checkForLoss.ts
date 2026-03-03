export const checkForLoss = (params: {
  incorrectGuesses: Array<string>
  maxIncorrectGuesses: number
}): boolean => {
  return params.incorrectGuesses.length >= params.maxIncorrectGuesses
}
