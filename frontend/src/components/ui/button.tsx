import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-[color,background-color,border-color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.99]',
  {
    variants: {
      variant: {
        default:
          'bg-navy-500 text-white shadow-sm shadow-navy-500/20 hover:bg-navy-400 hover:brightness-[1.02]',
        secondary: 'bg-navy-950 text-white hover:bg-navy-800',
        accent: 'bg-cyan-600 text-white hover:bg-cyan-700',
        outline:
          'border border-navy-100 bg-white text-navy-800 shadow-sm shadow-slate-900/5 hover:border-navy-200 hover:bg-surface',
        ghost: 'text-navy-700 hover:bg-navy-50',
        warning: 'bg-warning text-white hover:brightness-95',
        danger: 'bg-danger text-white hover:brightness-95',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-5 text-[15px]',
        xl: 'h-12 px-7 text-[15px] font-semibold tracking-tight',
        full: 'h-11 w-full px-4 font-semibold',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
