/* v8 ignore start */
import { HandlerEntry } from '~src/utils/testing/types'

import type { HandlerFn } from '~src/utils/testing/types'

export const handlers: HandlerEntry[] = []

export const Given = (text: string | RegExp, handler: HandlerFn) => {
  handlers.push({ prefix: 'Given ', text, handler })
}

export const When = (text: string | RegExp, handler: HandlerFn) => {
  handlers.push({ prefix: 'When ', text, handler })
}

export const Then = (text: string | RegExp, handler: HandlerFn) => {
  handlers.push({ prefix: 'Then ', text, handler })
}
