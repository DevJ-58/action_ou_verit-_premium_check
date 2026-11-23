import { vibrate } from './audio/haptics'
import { sfx } from './audio/sfx'

/** Game sounds and vibrations, respecting the player's settings. */
export const feedback = {
  spinTick() {
    sfx.play('tick')
    vibrate(8)
  },
  reveal() {
    sfx.play('reveal')
    vibrate([20, 40, 20])
  },
  success() {
    sfx.play('success')
    vibrate(30)
  },
  yourTurn() {
    sfx.play('yourTurn')
    vibrate([40, 60, 40])
  },
  proposal() {
    sfx.play('proposal')
    vibrate(10)
  },
  message() {
    sfx.play('message')
    vibrate(15)
  },
  reaction() {
    sfx.play('reaction')
  },
  vote() {
    sfx.play('vote')
    vibrate(10)
  },
  finish() {
    sfx.play('finish')
    vibrate([30, 50, 30, 50, 60])
  },
}

export type FeedbackName = keyof typeof feedback
