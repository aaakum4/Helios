import { createClient } from '@supabase/supabase-js'

let cachedSupabaseClient = null

function getCurrentOrigin() {
  if (typeof window === 'undefined' || !window.location) {
    return ''
  }

  return window.location.origin || ''
}

export function getSupabaseAuthRedirectUrl() {
  const configured = (import.meta.env.VITE_SUPABASE_AUTH_REDIRECT_URL || '').trim()
  if (configured) {
    return configured
  }

  return getCurrentOrigin()
}

export function isSupabaseConfigured() {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Cloud sync is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
  }

  if (!cachedSupabaseClient) {
    cachedSupabaseClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  }

  return cachedSupabaseClient
}