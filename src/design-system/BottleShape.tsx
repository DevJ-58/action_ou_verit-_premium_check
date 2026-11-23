import { useId } from 'react'

const BODY = 'M51 86 Q49 66 55 58 L56.5 42 L63.5 42 L65 58 Q71 66 69 86 Q60 90 51 86Z'

/** The wax-patterned bottle of the logo, drawn upright around (60, 60) in a 120 box. */
export function BottleShape() {
  const id = useId().replace(/:/g, '')
  return (
    <g>
      <defs>
        <clipPath id={`b${id}`}>
          <path d={BODY} />
        </clipPath>
        <pattern id={`w${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#fffcf5" />
          <path d="M4 0.8 L7.2 4 L4 7.2 L0.8 4Z" fill="#e05a2b" />
        </pattern>
      </defs>
      <rect x="40" y="38" width="40" height="56" fill={`url(#w${id})`} clipPath={`url(#b${id})`} />
      <path d={BODY} fill="none" stroke="#e3b23c" strokeWidth="2.5" />
      <rect x="56" y="35" width="8" height="8" rx="1.5" fill="#e3b23c" />
    </g>
  )
}
