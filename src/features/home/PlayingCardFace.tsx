export interface PlayingCardFaceProps {
  className: string
  rim: string
  letter: string
  letterClass?: string
  word: string
}

/** Face of a decorative playing card with corner letters. */
export function PlayingCardFace({
  className,
  rim,
  letter,
  letterClass,
  word,
}: PlayingCardFaceProps) {
  return (
    <div
      className={`absolute flex h-64 w-45 flex-col justify-between rounded-[18px] p-3.5 shadow-card ${className}`}
    >
      <span className="absolute inset-[7px] rounded-xl border" style={{ borderColor: rim }} />
      <span className={`font-display text-2xl leading-[0.9] ${letterClass ?? ''}`}>{letter}</span>
      <span className="self-center font-display text-[38px]">{word}</span>
      <span
        className={`rotate-180 self-end font-display text-2xl leading-[0.9] ${letterClass ?? ''}`}
      >
        {letter}
      </span>
    </div>
  )
}
