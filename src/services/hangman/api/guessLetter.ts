import { api, APIError, ErrCode, Header } from 'encore.dev/api'
import { events } from '~encore/clients'
import type { RoundAggregate } from '~src/services/hangman/aggregates/Round/types/RoundAggregate'
import type { RoundEvent } from '~src/services/hangman/aggregates/Round/RoundEvent'
import { loadRoundAggregate } from '~src/services/hangman/aggregates/Round/loadRoundAggregate'
import { roundAggregateReducer } from '~src/services/hangman/aggregates/Round/roundAggregateReducer'
import { validateGuess } from '~src/services/hangman/utils/validateGuess'
import { checkForWin } from '~src/services/hangman/utils/checkForWin'
import { checkForLoss } from '~src/services/hangman/utils/checkForLoss'
import type { LetterGuessedEvent } from '~src/services/hangman/aggregates/Round/events/LetterGuessed/LetterGuessedEvent'
import type { RoundWonEvent } from '~src/services/hangman/aggregates/Round/events/RoundWon/RoundWonEvent'
import type { RoundLostEvent } from '~src/services/hangman/aggregates/Round/events/RoundLost/RoundLostEvent'
import { generateId } from '~src/utils/id/generateId'

interface GuessLetterRequest {
  round: { id: string }
  letter: string
  namespaceSlug?: Header<'X-Namespace-Slug'>
}

export interface GuessLetterResponse {
  aggregate: RoundAggregate
}

export const guessLetter = api(
  { expose: true, method: 'POST' },
  async (params: GuessLetterRequest): Promise<GuessLetterResponse> => {
    const { round, letter, namespaceSlug = 'main' } = params
    const namespace = { slug: namespaceSlug }

    const aggregate = await loadRoundAggregate({ id: round.id, namespace })

    if (aggregate == null) {
      throw new APIError(
        ErrCode.NotFound,
        `Round with ID ${round.id} not found`,
      )
    }

    const validation = validateGuess({ aggregate, letter })

    if (!validation.valid) {
      throw new APIError(ErrCode.FailedPrecondition, validation.reason)
    }

    const guessEvent: LetterGuessedEvent = {
      name: 'LetterGuessed',
      version: 1,
      id: generateId({ mode: 'random' }),
      aggregate: { name: 'Round', id: round.id, service: { name: 'hangman' } },
      data: { letter: letter.toLowerCase() },
    }

    const eventsToCommit: Array<RoundEvent> = [guessEvent]

    const afterGuess = roundAggregateReducer(aggregate, guessEvent)

    /* v8 ignore next 3 */
    if (afterGuess == null) {
      throw new APIError(ErrCode.Internal, 'Failed to apply guess')
    }

    if (checkForWin(afterGuess.maskedWord)) {
      const wonEvent: RoundWonEvent = {
        name: 'RoundWon',
        version: 1,
        id: generateId({ mode: 'random' }),
        aggregate: {
          name: 'Round',
          id: round.id,
          service: { name: 'hangman' },
        },
        data: {},
      }
      eventsToCommit.push(wonEvent)
    } else if (
      checkForLoss({
        incorrectGuesses: afterGuess.incorrectGuesses,
        maxIncorrectGuesses: afterGuess.maxIncorrectGuesses,
      })
    ) {
      const lostEvent: RoundLostEvent = {
        name: 'RoundLost',
        version: 1,
        id: generateId({ mode: 'random' }),
        aggregate: {
          name: 'Round',
          id: round.id,
          service: { name: 'hangman' },
        },
        data: {},
      }
      eventsToCommit.push(lostEvent)
    }

    await events.commitTransaction({ events: eventsToCommit, namespace })

    let finalAggregate = afterGuess
    for (const event of eventsToCommit.slice(1)) {
      const result = roundAggregateReducer(finalAggregate, event)
      /* v8 ignore next 3 */
      if (result == null) {
        throw new APIError(ErrCode.Internal, 'Failed to apply event')
      }
      finalAggregate = result
    }

    const sanitizedAggregate =
      finalAggregate.status === 'inProgress'
        ? { ...finalAggregate, word: '' }
        : finalAggregate

    return { aggregate: sanitizedAggregate }
  },
)
