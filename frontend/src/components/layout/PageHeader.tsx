import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-navy-100 bg-white px-5 py-3.5 sm:px-6',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-navy-800">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export { PageHeader }
