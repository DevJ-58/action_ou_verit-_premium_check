import { useEffect, useRef, useState } from 'react'
import { isBot } from '@/content/axis'
import type { ChatStore } from '@/features/chat/chatStore'
import type { RoomStoreState } from '@/features/room/roomStore'
import type { RoomState } from '@/features/room/types'
import { useSettings } from '@/features/settings/settingsStore'
import { setAxisMood } from './axisMood'
import { planBot, type BotMove } from './planBot'
import { replyFor } from './replies'

/** At most one spontaneous line in this time, so Axis never floods the chat. */
const SAY_GAP_MS = 8000
const REPLY_GAP_MS = 4000
const REPLY_DELAY_MS = 2000

/**
 * On the host's phone only: plays the room's built-in players (Axis) — their moves at the
 * right time, their chat lines, and their answers when someone talks to them.
 */
export function useBotDriver(state: RoomStoreState, chat?: ChatStore) {
  const language = useSettings((s) => s.language)
  const latest = useRef(state)
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const done = useRef(new Set<string>())
  const lastSay = useRef(0)
  useEffect(() => {
    latest.current = state
  })
  const { room, role } = state
  const host = role === 'host'

  useEffect(() => {
    if (!room || !host) return
    const perform = (botId: string, move: BotMove) => {
      const s = latest.current
      if (move.intent) s.actAs(botId, move.intent)
      if (move.react) s.actAs(botId, { type: 'react', emoji: move.react })
      if (move.say && Date.now() - lastSay.current >= SAY_GAP_MS) {
        lastSay.current = Date.now()
        s.say(botId, move.say.text, move.say.mood)
      }
    }
    const wanted = new Set<string>()
    for (const bot of room.members.filter((m) => isBot(m.id))) {
      for (const move of planBot(room, bot.id, language)) {
        const key = `${bot.id}:${move.key}`
        wanted.add(key)
        if (done.current.has(key) || timers.current.has(key)) continue
        const timer = setTimeout(() => {
          timers.current.delete(key)
          done.current.add(key)
          perform(bot.id, move)
        }, move.delayMs)
        timers.current.set(key, timer)
      }
    }
    for (const [key, timer] of timers.current) {
      if (wanted.has(key)) continue
      clearTimeout(timer)
      timers.current.delete(key)
    }
  }, [room, host, language])

  useEffect(() => {
    const pending = timers.current
    return () => {
      for (const timer of pending.values()) clearTimeout(timer)
      pending.clear()
    }
  }, [])

  // Answers people who greet him or say his name.
  useEffect(() => {
    if (!chat || !host) return
    const since = Date.now()
    const answered = new Set<string>()
    let lastReply = 0
    return chat.subscribe(({ messages }) => {
      const s = latest.current
      const bot = s.room?.members.find((m) => isBot(m.id))
      if (!bot) return
      for (const m of messages) {
        if (m.at < since || answered.has(m.id) || isBot(m.from) || !m.text) continue
        answered.add(m.id)
        const name = s.room?.members.find((x) => x.id === m.from)?.pseudo ?? ''
        const text = replyFor(m.text, name, m.id, language)
        if (!text || Date.now() - lastReply < REPLY_GAP_MS) continue
        lastReply = Date.now()
        setTimeout(() => latest.current.say(bot.id, text, 'happy'), REPLY_DELAY_MS)
      }
    })
  }, [chat, host, language])
}

/** On every phone: shows Axis's lines in the chat, and his face reacts when he speaks. */
export function useBotChat(room: RoomState | null, chat: ChatStore) {
  const [since] = useState(() => Date.now())
  const lines = room?.botChat
  useEffect(() => {
    for (const line of lines ?? []) {
      const fresh = line.at >= since
      if (chat.getState().receive(line, fresh) && fresh) setAxisMood(line.mood, { talk: true })
    }
  }, [lines, chat, since])
}
