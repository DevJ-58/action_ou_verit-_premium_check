import type { CSSProperties } from 'react'

export interface PlayingCardFaceProps {
  className: string
  style: CSSProperties
  rim: string
  letter: string
  letterClass?: string
  word: string
}

/** Face of a decorative playing card with corner letters (sized in container units). */
export function PlayingCardFace({
  className,
  style,
  rim,
  letter,
  letterClass,
  word,
}: PlayingCardFaceProps) {
  return (
    <div
      className={`absolute flex flex-col justify-between rounded-[4.6cqw] p-[3.6cqw] shadow-card ${className}`}
      style={{ width: '46cqw', height: '65.6cqw', ...style }}
    >
      <span
        className="absolute inset-[1.8cqw] rounded-[3cqw] border"
        style={{ borderColor: rim }}
      />
      <span className={`font-display text-[6.2cqw] leading-[0.9] ${letterClass ?? ''}`}>
        {letter}
      </span>
      <span className="self-center font-display text-[9.7cqw]">{word}</span>
      <span
        className={`rotate-180 self-end font-display text-[6.2cqw] leading-[0.9] ${letterClass ?? ''}`}
      >
        {letter}
      </span>
    </div>
  )
}
