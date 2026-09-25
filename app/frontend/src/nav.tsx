import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Route } from './types'

export interface Nav {
  stack: Route[]
  current: Route
  push: (route: Route) => void
  replace: (route: Route) => void
  pop: () => void
  reset: (route: Route) => void
}

const NavCtx = createContext<Nav | null>(null)

function isStackState(value: unknown): value is { stack: Route[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as { stack?: unknown }).stack) &&
    ((value as { stack: unknown[] }).stack).length > 0
  )
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'dashboard' }])
  const stackRef = useRef<Route[]>(stack)
  const readyRef = useRef(false)

  const commit = useCallback((next: Route[]) => {
    stackRef.current = next
    setStack(next)
  }, [])

  useEffect(() => {
    readyRef.current = true
    window.history.replaceState({ stack: [{ name: 'dashboard' }] }, '')

    const onPopState = (event: PopStateEvent) => {
      if (!readyRef.current) return
      if (isStackState(event.state)) {
        commit(event.state.stack)
      } else {
        // No valid entry (fresh load / external navigation): guard so the app is not closed.
        window.history.pushState({ stack: stackRef.current }, '')
      }
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [commit])

  const push = useCallback(
    (route: Route) => {
      const next = [...stackRef.current, route]
      commit(next)
      window.history.pushState({ stack: next }, '')
    },
    [commit],
  )

  const replace = useCallback(
    (route: Route) => {
      const next = stackRef.current.length ? [...stackRef.current.slice(0, -1), route] : [route]
      commit(next)
      window.history.replaceState({ stack: next }, '')
    },
    [commit],
  )

  const pop = useCallback(() => {
    if (stackRef.current.length <= 1) return
    window.history.back()
  }, [])

  const reset = useCallback(
    (route: Route) => {
      const next = [route]
      commit(next)
      window.history.replaceState({ stack: next }, '')
    },
    [commit],
  )

  const value = useMemo(
    () => ({ stack, current: stack[stack.length - 1], push, replace, pop, reset }),
    [stack, push, replace, pop, reset],
  )

  return <NavCtx.Provider value={value}>{children}</NavCtx.Provider>
}

export function useNav(): Nav {
  const ctx = useContext(NavCtx)
  if (!ctx) throw new Error('useNav must be used inside NavProvider')
  return ctx
}