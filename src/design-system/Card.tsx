import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/** A flat surface with a thin gold rim — the app's basic container. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border border-line p-4', className)} {...rest} />
}
