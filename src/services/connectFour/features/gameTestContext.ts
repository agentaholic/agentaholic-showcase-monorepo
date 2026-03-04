/* v8 ignore start */
let gameId: string | undefined = undefined

export const setCurrentGameId = (id: string) => {
  gameId = id
}

export const currentGameId = (): string => {
  if (gameId === undefined) {
    throw new Error('No game ID set. Did you forget to start a game?')
  }
  return gameId
}

export const clearCurrentGameId = () => {
  gameId = undefined
}
