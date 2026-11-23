/** Three little bars dancing while someone talks. */
export function SpeakingBars() {
  return (
    <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-[3px] rounded-full bg-gold motion-safe:animate-[speak_0.6s_ease-in-out_infinite_alternate]"
          style={{ height: '100%', animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}
