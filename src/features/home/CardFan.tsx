import { PlayingCardFace } from './PlayingCardFace'

/**
 * Decorative fan of three playing cards (wax back, Vérité, Action).
 * Sized in container units so it always fits its column, from 320 px phones to desktops.
 */
export function CardFan() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[390/316] w-full max-w-[460px] [container-type:inline-size]"
    >
      <div
        className="absolute overflow-hidden rounded-[4.6cqw] border-[1.5px] border-[#e3b23c] bg-ink shadow-card"
        style={{ left: '26.9cqw', top: '0', width: '46cqw', height: '65.6cqw', rotate: '-1deg' }}
      >
        <svg viewBox="0 0 180 256" className="size-full">
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
        className="bg-truth text-ivory"
        style={{ left: '8.7cqw', top: '11.3cqw', transform: 'rotateY(14deg) rotate(-12deg)' }}
        rim="#e3b23c"
        letter="V"
        word="Vérité"
      />
      <PlayingCardFace
        className="bg-card-ivory text-ink"
        style={{ left: '45.1cqw', top: '14.4cqw', transform: 'rotateY(-14deg) rotate(10deg)' }}
        rim="#c99a2e"
        letter="A"
        letterClass="text-dare-ink"
        word="Action"
      />
    </div>
  )
}
