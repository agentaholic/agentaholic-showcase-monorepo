/* v8 ignore start */
let roundId: string | undefined = undefined
let word: string | undefined = undefined

export const setCurrentRoundId = (id: string) => {
  roundId = id
}

export const currentRoundId = (): string => {
  if (roundId === undefined) {
    throw new Error('No round ID set. Did you forget to start a round?')
  }
  return roundId
}

export const setCurrentWord = (newWord: string) => {
  word = newWord
}

export const currentWord = (): string => {
  if (word === undefined) {
    throw new Error('No word set. Did you forget to start a round?')
  }
  return word
}

export const clearCurrentRoundContext = () => {
  roundId = undefined
  word = undefined
}
