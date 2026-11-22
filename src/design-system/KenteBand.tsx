const UNITS = Array.from({ length: 8 }, (_, i) => i)

/** Decorative kente-inspired band (flat colours, no gradients). */
export function KenteBand() {
  return (
    <div aria-hidden="true" className="flex h-6.5 overflow-hidden">
      {UNITS.map((i) => (
        <div key={i} className="flex h-full w-16.25 shrink-0">
          <div className="flex w-5.5 flex-col items-center justify-around bg-[var(--gold)]">
            <span className="h-1 w-3 bg-[var(--kente-dark)]" />
            <span className="h-1 w-3 bg-[var(--kente-dark)]" />
          </div>
          <div className="w-1.25 bg-dare" />
          <div className="w-0.75 bg-[var(--kente-dark)]" />
          <div className="flex w-5 flex-col justify-around bg-truth py-0.5">
            <span className="ml-0.5 h-0.75 w-2 bg-[#e3b23c]" />
            <span className="ml-2.5 h-0.75 w-2 bg-[#e3b23c]" />
            <span className="ml-0.5 h-0.75 w-2 bg-[#e3b23c]" />
            <span className="ml-2.5 h-0.75 w-2 bg-[#e3b23c]" />
          </div>
          <div className="w-1.25 bg-dare" />
          <div className="flex w-2.5 items-center justify-center bg-[var(--kente-dark)]">
            <span className="size-1.5 rotate-45 bg-[#e3b23c]" />
          </div>
        </div>
      ))}
    </div>
  )
}
