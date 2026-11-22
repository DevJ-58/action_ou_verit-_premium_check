import type { SupabaseClient } from '@supabase/supabase-js'

export interface SupabaseConfig {
  url: string
  key: string
}

/**
 * Supabase settings from the build environment (public values only: project URL and
 * publishable key). Absent, or VITE_BACKEND=local → the app runs on its local backends.
 */
export function supabaseConfig(): SupabaseConfig | null {
  const env = import.meta.env
  const url = env.VITE_SUPABASE_URL as string | undefined
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
  if (env.VITE_BACKEND === 'local' || !url || !key) return null
  return { url, key }
}

let client: Promise<SupabaseClient> | null = null

/** The Supabase client, loaded on first use so it stays out of the initial bundle. */
export function getSupabase(config: SupabaseConfig): Promise<SupabaseClient> {
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(config.url, config.key, {
      auth: { persistSession: true, autoRefreshToken: true },
    }),
  )
  return client
}
