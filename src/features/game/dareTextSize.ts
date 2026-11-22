/** Font size for the dare text so it always fits, smaller on a sideways card. */
export function dareTextSize(length: number, sideways: boolean): string {
  if (!sideways) return length <= 140 ? 'text-[22px]' : 'text-[17px]'
  if (length <= 50) return 'text-[22px]'
  if (length <= 100) return 'text-[17px]'
  if (length <= 160) return 'text-[15px]'
  return 'text-[13px]'
}
