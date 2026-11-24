import { test as base } from '@playwright/test'

export { expect, type Page } from '@playwright/test'

/**
 * Tests that are not about the step-by-step guide start with every guide already seen,
 * so it never covers what they tap. (tests/e2e/guide.spec.ts tests the guide itself.)
 */
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.addInitScript(() => {
      try {
        const saved = JSON.parse(localStorage.getItem('av:settings') ?? 'null') ?? {
          state: {},
          version: 1,
        }
        saved.state = { ...saved.state, toursSeen: ['home', 'lobby', 'game'] }
        localStorage.setItem('av:settings', JSON.stringify(saved))
      } catch {
        // Storage unavailable: nothing to do.
      }
    })
    await provide(context)
  },
})
