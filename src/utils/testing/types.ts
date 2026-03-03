export type Fixtures = {
  scenario: { id: string }
  params: RegExpMatchArray
  routes?: React.ReactNode
}

export type HandlerFn =
  | ((fixtures: Fixtures) => void | Promise<void>)
  | ((fixtures: Fixtures) => Promise<{ backgroundPromise: Promise<void> }>)
  | ((fixtures: Fixtures) => { backgroundPromise: Promise<void> })

export interface HandlerEntry {
  prefix: 'Given ' | 'When ' | 'Then '
  text: string | RegExp
  handler: HandlerFn
}

export interface Scenario {
  name: string
  steps: string[]
  hash: string
  skip?: boolean
  only?: boolean
  routes?: React.ReactNode
}

export interface Feature {
  name: string
  scenarios: Scenario[]
  skip?: boolean
  only?: boolean
}

export type FeatureBlock = (params: {
  // Use function overloads for Scenario
  Scenario: {
    // First overload: name and steps only
    (name: string, steps: string[]): void
    // Second overload: name, options, and steps
    (
      name: string,
      options: { only?: boolean; skip?: boolean; routes?: React.ReactNode },
      steps: string[],
    ): void
  }
}) => void
