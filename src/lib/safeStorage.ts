import type { StateStorage } from 'zustand/middleware'

/**
 * localStorage wrapper that never throws: private browsing, blocked site data
 * or a full quota must never crash the app — we just lose persistence.
 */
export const safeStorage: StateStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value)
    } catch {
      // Storage unavailable or full: keep running without persistence.
    }
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name)
    } catch {
      // Ignore.
    }
  },
}

/** Same guarantees for sessionStorage (per tab). */
export const safeSessionStorage: StateStorage = {
  getItem(name) {
    try {
      return window.sessionStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem(name, value) {
    try {
      window.sessionStorage.setItem(name, value)
    } catch {
      // Ignore.
    }
  },
  removeItem(name) {
    try {
      window.sessionStorage.removeItem(name)
    } catch {
      // Ignore.
    }
  },
}
