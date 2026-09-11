import * as LabelPrimitive from '@radix-ui/react-label'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-600',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
