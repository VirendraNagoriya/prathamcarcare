import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
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

export function NavProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<Route[]>([{ name: 'dashboard' }])

  const push = useCallback((route: Route) => setStack((s) => [...s, route]), [])
  const replace = useCallback(
    (route: Route) => setStack((s) => (s.length ? [...s.slice(0, -1), route] : [route])),
    [],
  )
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), [])
  const reset = useCallback((route: Route) => setStack([route]), [])

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