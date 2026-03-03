const words = [
  'apple',
  'brave',
  'crane',
  'delta',
  'eagle',
  'flame',
  'grape',
  'house',
  'ivory',
  'jewel',
  'knife',
  'lemon',
  'maple',
  'noble',
  'ocean',
  'pearl',
  'queen',
  'river',
  'stone',
  'tiger',
  'urban',
  'valve',
  'whale',
  'yacht',
  'zebra',
]

export const pickRandomWord = (): string => {
  const index = Math.floor(Math.random() * words.length)
  return words[index]
}
