import { useEffect, useState } from 'react'

export type AsyncState<T> = { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error }

/** Runs `load(key)` and again whenever `key` changes; results of an outdated key are ignored. */
export function useAsync<T>(load: (key: string) => Promise<T>, key = ''): AsyncState<T> {
  const [state, setState] = useState<{ key: string; result: AsyncState<T> }>()
  useEffect(() => {
    let current = true
    load(key).then(
      (data) => current && setState({ key, result: { status: 'success', data } }),
      (error: unknown) => current && setState({ key, result: { status: 'error', error: toError(error) } }),
    )
    return () => {
      current = false
    }
  }, [load, key])
  return state?.key === key ? state.result : { status: 'loading' }
}

const toError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)))
