import { useAxisFace } from '@/features/bot/axisMood'

/** Axis's face, with his current expression. */
export function AxisFace({ name }: { name: string }) {
  const src = useAxisFace()
  return <img src={src} alt={name} draggable={false} className="size-full scale-110 object-cover" />
}
