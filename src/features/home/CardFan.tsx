import { PlayingCardFace } from './PlayingCardFace'

/** Decorative fan of three playing cards (wax back, Vérité, Action). */
export function CardFan() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-79 w-full max-w-[390px] [perspective:900px]"
    >
      <div className="absolute top-0 left-[105px] h-64 w-45 -translate-y-2 -rotate-1 overflow-hidden rounded-[18px] border-[1.5px] border-[#e3b23c] bg-ink shadow-card">
        <svg width="180" height="256" viewBox="0 0 180 256">
          <defs>
            <pattern id="wax" width="24" height="24" patternUnits="userSpaceOnUse">
              <path
                d="M12 2 L22 12 L12 22 L2 12 Z"
                fill="none"
                stroke="#e3b23c"
                strokeWidth="1.2"
              />
              <circle cx="12" cy="12" r="2.4" fill="#e05a2b" />
            </pattern>
          </defs>
          <rect x="10" y="10" width="160" height="236" rx="10" fill="url(#wax)" />
        </svg>
      </div>
      <PlayingCardFace
        className="top-11 left-[34px] bg-truth text-ivory [transform:rotateY(14deg)_rotate(-12deg)]"
        rim="#e3b23c"
        letter="V"
        word="Vérité"
      />
      <PlayingCardFace
        className="top-14 left-[176px] bg-card-ivory text-ink [transform:rotateY(-14deg)_rotate(10deg)]"
        rim="#c99a2e"
        letter="A"
        letterClass="text-dare-ink"
        word="Action"
      />
    </div>
  )
}
