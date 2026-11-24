/** One stop of a guide: the element marked `data-tour="<target>"`, and what it is for. */
export interface TourStep {
  target: string
  title: string
  text: string
}

/** The element of a step, if it is on the page and not hidden by its style. */
export function findTarget(target: string): HTMLElement | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`)
  // Browsers without checkVisibility (and tests) count any element in the page.
  return el && (el.checkVisibility?.() ?? true) ? el : null
}
