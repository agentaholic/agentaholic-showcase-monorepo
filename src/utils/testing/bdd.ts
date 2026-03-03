/* v8 ignore start */
import { createHash } from 'crypto'
import { describe, test } from 'vitest'
import { Scenario, FeatureBlock } from '~src/utils/testing/types'

import type { Feature as FeatureType } from '~src/utils/testing/types'
import Debug from 'debug'
const debug = Debug('test')

import { handlers } from '~src/utils/testing/bddSteps'

const parseSteps = (steps: string[]) => {
  const result: string[] = []
  steps.forEach((step) => {
    if (
      step.startsWith('Given ') ||
      step.startsWith('When ') ||
      step.startsWith('Then ')
    ) {
      result.push(step)
    } else if (step.startsWith('And ')) {
      if (result.length === 0) {
        throw new Error("Malformed step: 'And' cannot be the first step")
      }
      const lastStep = result[result.length - 1]
      const match = lastStep.match(/^(Given|When|Then)\s+/)
      if (!match) {
        throw new Error(`Invalid step format: ${lastStep}`)
      }
      result.push(`${match[1]} ${step.substring(4)}`)
    } else {
      throw new Error(
        `Invalid step prefix: "${step}". Steps must start with Given, When, Then, or And`,
      )
    }
  })
  return result
}

export const features: FeatureType[] = []

export const Feature = (
  name: string,
  optionsOrBlock:
    | { only?: boolean; skip?: boolean; routes?: React.ReactNode }
    | FeatureBlock,
  maybeBlock?: FeatureBlock,
) => {
  const featureOptions =
    typeof optionsOrBlock === 'function' ? {} : optionsOrBlock
  const block =
    typeof optionsOrBlock === 'function' ? optionsOrBlock : maybeBlock

  if (!block) {
    throw new Error('Feature options provided without a block function')
  }

  const scenarios: Scenario[] = []

  // oxlint-disable no-shadow -- ScenarioBuilder mirrors Feature's parameter names intentionally
  const ScenarioBuilder = (
    name: string,
    optionsOrSteps:
      | { only?: boolean; skip?: boolean; routes?: React.ReactNode }
      | string[],
    maybeSteps?: string[],
  ) => {
    const options = Array.isArray(optionsOrSteps) ? {} : optionsOrSteps
    const steps = Array.isArray(optionsOrSteps) ? optionsOrSteps : maybeSteps

    if (!steps) {
      throw new Error('Scenario steps are required')
    }

    const parsedSteps = parseSteps(steps)
    const hash = createHash('sha256')
      .update(parsedSteps.join('\n'))
      .digest('hex')

    scenarios.push({
      name,
      steps: parsedSteps,
      hash,
      skip: options.skip,
      only: options.only,
      routes: options.routes ?? featureOptions.routes,
    })
  }

  block({ Scenario: ScenarioBuilder })

  const feature = {
    name,
    scenarios,
    skip: featureOptions.skip,
    only: featureOptions.only,
  }

  const describer = feature.skip
    ? describe.skip
    : feature.only
      ? describe.only
      : describe

  describer(feature.name, () => {
    feature.scenarios.forEach((scenario) => {
      const tester = scenario.skip
        ? test.skip
        : scenario.only
          ? test.only
          : test

      tester(scenario.name, async () => {
        const remainingSteps = [...scenario.steps]

        const executeNextStepAndRemainingSteps = async () => {
          const step = remainingSteps.shift()

          if (step == null) {
            return
          }

          debug('Executing step: ', step)

          const handler = handlers.find((h) => {
            if (typeof h.text === 'string') {
              const pattern = h.prefix + h.text
              return step === pattern
            } else {
              return step.match(new RegExp(h.prefix + h.text.source))
            }
          })

          if (!handler) {
            throw new Error(`No handler found for step: "${step}"`)
          }

          let match: RegExpMatchArray | null = null
          if (handler.text instanceof RegExp) {
            const regexMatch = step.match(
              new RegExp(handler.prefix + handler.text.source),
            )
            if (regexMatch) {
              match = regexMatch
            }
          }

          const result = await handler.handler({
            params: match ?? ([] as unknown as RegExpMatchArray),
            scenario: { id: scenario.hash },
            routes: scenario.routes,
          })

          if (result?.backgroundPromise) {
            await Promise.race([
              result.backgroundPromise,
              executeNextStepAndRemainingSteps(),
            ])
          } else {
            await executeNextStepAndRemainingSteps()
          }
        }

        await executeNextStepAndRemainingSteps()
      })
    })
  })
}
