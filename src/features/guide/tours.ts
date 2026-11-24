/** One stop of a guide: the element marked `data-tour="<target>"`, and what it is for. */
export interface TourStep {
  target: string
  title: string
  text: string
}

export const findTarget = (target: string) =>
  document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
