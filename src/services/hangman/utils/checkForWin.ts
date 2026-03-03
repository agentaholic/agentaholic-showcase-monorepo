export const checkForWin = (maskedWord: Array<string | null>): boolean => {
  return maskedWord.every((letter) => letter != null)
}
