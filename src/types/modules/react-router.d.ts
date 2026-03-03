/* v8 ignore start */
import 'react-router'

// Since we're using react-router in "declarative" mode, we can narrow the type
// returned by react-router's `navigate` method to avoid async logic. See thread:
// https://github.com/remix-run/react-router/issues/12348#issuecomment-3045470328
declare module 'react-router' {
  interface NavigateFunction {
    (to: To, options?: NavigateOptions): void
    (delta: number): void
  }
}

/* v8 ignore stop */
