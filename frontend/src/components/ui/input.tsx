import type { InputHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-lg border border-navy-100 bg-white px-3 text-sm text-navy-900 shadow-sm outline-none transition-colors placeholder:text-navy-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed disabled:bg-navy-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
