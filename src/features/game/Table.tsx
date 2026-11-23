import { useEffect, useState } from 'react'
import { seatAngle, type GameState } from '@/engine'
import { feedback } from '@/lib/feedback'
import { Bottle } from './Bottle'
import { FacetTable } from './FacetTable'
import { Seat } from './Seat'

export interface TableProps {
  game: GameState
  animate: boolean
}

/** Faceted table with the players in a circle and the bottle (or light sweep) in the middle. */
export function Table({ game, animate }: TableProps) {
  const { players, turn, phase, settings } = game
  const spinning = phase === 'spinning'
  const revealed = turn !== null && !spinning
  const sweep = useSweep(spinning && settings.picker === 'random' && animate, players.length)

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(340px,42dvh)] min-[900px]:max-w-[min(420px,62dvh)]">
      <FacetTable />
      {settings.picker === 'bottle' ? (
        <Bottle rotation={game.bottleRotation} animate={animate} />
      ) : null}
      {players.map((player, index) => (
        <Seat
          key={player.id}
          name={player.name}
          avatarId={player.avatar}
          angle={seatAngle(index, players.length)}
          lit={sweep === index}
          role={
            revealed && player.id === turn.answererId
              ? 'answerer'
              : revealed && settings.flow !== 'everyone' && player.id === turn.askerId
                ? 'asker'
                : 'none'
          }
        />
      ))}
    </div>
  )
}

/** Index of the seat lit by the light sweep, cycling while active. */
function useSweep(active: boolean, count: number): number | null {
  const [index, setIndex] = useState<number | null>(null)
  useEffect(() => {
    if (!active) return
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % count
      setIndex(i)
      feedback.spinTick()
    }, 140)
    return () => clearInterval(id)
  }, [active, count])
  return active ? index : null
}
