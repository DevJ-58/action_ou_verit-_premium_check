import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'truth' | 'dare' | 'ghost' | 'danger'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'md' | 'lg'
  loading?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-gold text-on-gold',
  truth: 'bg-truth text-ivory',
  dare: 'bg-card-ivory text-ink',
  ghost: 'border-[1.5px] border-line bg-transparent text-text',
  danger: 'border-[1.5px] border-dare bg-transparent text-text',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex select-none items-center justify-center gap-2.5 rounded-lg px-5 font-extrabold tracking-[0.06em] uppercase',
        'transition-[transform,opacity] duration-(--dur-fast) ease-(--ease-out-expo) active:scale-[0.97]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'lg' ? 'min-h-15 text-base' : 'min-h-12 text-sm',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  )
}
