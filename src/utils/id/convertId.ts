import makeTranslator from 'short-uuid'

const translator = makeTranslator()

export const convertId = (
  params:
    | {
        from: 'uuid'
        to: 'flickrBase58'
        value: string
      }
    | {
        from: 'flickrBase58'
        to: 'uuid'
        value: string
      },
) => {
  switch (params.to) {
    case 'uuid': {
      return translator.toUUID(params.value)
    }

    case 'flickrBase58': {
      return translator.fromUUID(params.value)
    }
  }
}
