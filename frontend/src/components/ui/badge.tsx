import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'ready' | 'idle' | 'processing' | 'completed' | 'error' | 'demo' | 'neutral'
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  idle: 'bg-navy-50 text-navy-600 border-navy-100',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  error: 'bg-red-50 text-danger border-red-200',
  demo: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  neutral: 'bg-white text-navy-700 border-navy-100',
}

function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
