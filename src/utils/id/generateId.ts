/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { v4, v5 } from 'uuid'
import { convertId } from './convertId'

export const generateId = (
  params:
    | {
        mode: 'deterministic'
        namespace?: string
        input: string
      }
    | {
        mode: 'random'
      },
) => {
  switch (params.mode) {
    case 'deterministic': {
      const { namespace = '00000000-0000-0000-0000-000000000000', input } =
        params

      return convertId({
        from: 'uuid',
        to: 'flickrBase58',
        value: v5(input, namespace),
      })
    }

    case 'random': {
      return convertId({
        from: 'uuid',
        to: 'flickrBase58',
        value: v4(),
      })
    }
  }
}
