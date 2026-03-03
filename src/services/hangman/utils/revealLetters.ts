export const revealLetters = (params: {
  word: string
  letter: string
  maskedWord: Array<string | null>
}): Array<string | null> => {
  const { word, letter, maskedWord } = params
  const lowerLetter = letter.toLowerCase()

  return maskedWord.map((current, index) =>
    word[index].toLowerCase() === lowerLetter ? word[index] : current,
  )
}
