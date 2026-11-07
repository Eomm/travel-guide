import { Component, type ReactNode } from 'react'

interface Props {
  /** The message shown when the section crashes: the error message is appended. */
  fallback: (message: string) => ReactNode
  /** A new value (a change of the draft) clears the error and tries the section again. */
  resetKey: unknown
  children: ReactNode
}

interface State {
  error?: Error
  resetKey: unknown
}

/**
 * A draft is any file, possibly far from the schema: if a section can't show it, the error stays in that
 * section and the Planner bar (issues, export, discard) keeps working.
 */
export default class SectionBoundary extends Component<Props, State> {
  state: State = { resetKey: this.props.resetKey }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey === state.resetKey ? null : { error: undefined, resetKey: props.resetKey }
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error.message) : this.props.children
  }
}
