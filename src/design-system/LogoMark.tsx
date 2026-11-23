import { BottleShape } from './BottleShape'

const SEATS = [
  '#e05a2b',
  '#e3b23c',
  '#e05a2b',
  '#4757e8',
  '#e05a2b',
  '#4757e8',
  '#e05a2b',
  '#4757e8',
]

export interface LogoMarkProps {
  size?: number
  /** Accessible name; decorative when absent. */
  label?: string
  className?: string
}

/** « La Table »: players around the table, the wax bottle pointing at one of them. */
export function LogoMark({ size = 40, label, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <circle cx="60" cy="60" r="46" fill="#2a2742" stroke="#e3b23c" strokeWidth="2.5" />
      {SEATS.map((fill, i) => {
        const a = (i * Math.PI) / 4 - Math.PI / 2
        return (
          <circle
            key={i}
            cx={60 + 38 * Math.cos(a)}
            cy={60 + 38 * Math.sin(a)}
            r="5.5"
            fill={fill}
          />
        )
      })}
      <g transform="rotate(45 60 60)">
        <BottleShape />
      </g>
    </svg>
  )
}
