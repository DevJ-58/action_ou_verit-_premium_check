const CENTER = 170
const OUTER = 134
const INNER = 78
const SECTORS = 12
const TONES = ['var(--facet-1)', 'var(--facet-2)', 'var(--facet-3)', 'var(--facet-4)']

function point(radius: number, sector: number): string {
  const angle = (sector * 2 * Math.PI) / SECTORS
  return `${(CENTER + radius * Math.sin(angle)).toFixed(1)} ${(CENTER - radius * Math.cos(angle)).toFixed(1)}`
}

const FACETS = Array.from({ length: SECTORS }, (_, i) => {
  const [i1, i2, o1, o2] = [
    point(INNER, i),
    point(INNER, i + 1),
    point(OUTER, i),
    point(OUTER, i + 1),
  ]
  return [
    { d: `M${i1} L${o1} L${o2} Z`, fill: TONES[i % 4]! },
    { d: `M${i1} L${o2} L${i2} Z`, fill: TONES[(i + 2) % 4]! },
    { d: `M${CENTER} ${CENTER} L${i1} L${i2} Z`, fill: TONES[(i + 1) % 4]! },
  ]
}).flat()

const RIM = `M${Array.from({ length: SECTORS }, (_, i) => point(OUTER, i)).join(' L')} Z`

/** The faceted, gem-cut table drawn with flat tones from the current theme. */
export function FacetTable() {
  return (
    <svg aria-hidden="true" viewBox="0 0 340 340" className="absolute inset-0 size-full">
      <circle
        cx={CENTER}
        cy={CENTER}
        r="146"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.2"
        strokeDasharray="2 6"
      />
      {FACETS.map((facet, i) => (
        <path key={i} d={facet.d} fill={facet.fill} />
      ))}
      <path d={RIM} fill="none" stroke="var(--gold)" strokeWidth="2" />
    </svg>
  )
}
