import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

import { cn } from '@/lib/utils'

interface AwaitingStateProps {
  title: string
  detail: string
  icon?: LucideIcon
  className?: string
}

function AwaitingState({
  title,
  detail,
  icon: Icon = Inbox,
  className,
}: AwaitingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start rounded-xl border border-dashed border-navy-100 bg-navy-50/60 px-4 py-5',
        className,
      )}
    >
      <Icon className="h-4 w-4 text-navy-500" />
      <p className="mt-3 text-sm font-semibold text-navy-900">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-navy-600">{detail}</p>
    </div>
  )
}

export { AwaitingState }
