import type { InputHTMLAttributes, ReactNode } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ParameterFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  unit?: string
  error?: string
  hint?: ReactNode
}

function ParameterField({
  label,
  unit,
  error,
  hint,
  id,
  className,
  ...props
}: ParameterFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          className={cn(
            unit && 'pr-16',
            error && 'border-danger focus:border-danger focus:ring-red-500/15',
            className,
          )}
          {...props}
        />
        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-navy-500">
            {unit}
          </span>
        ) : null}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-navy-500">{hint}</p> : null}
    </div>
  )
}

export { ParameterField }
