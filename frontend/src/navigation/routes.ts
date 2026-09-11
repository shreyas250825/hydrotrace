import type { AppView } from '@/types/simulation'

export const APP_VIEWS: AppView[] = [
  'overview',
  'scenario',
  'geospatial',
  'command',
  'simulation',
  'comparison',
  'impact',
  'methodology',
  'intelligence',
]

export function pathForView(view: AppView): string {
  if (view === 'overview') return '/app'
  return `/app/${view}`
}

export function viewFromPath(pathname: string): AppView | null {
  if (pathname === '/app' || pathname === '/app/') return 'overview'
  const match = pathname.match(/^\/app\/([a-z-]+)/)
  if (!match) return null
  const id = match[1] as AppView
  return APP_VIEWS.includes(id) ? id : null
}
