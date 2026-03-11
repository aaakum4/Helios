import { getSupabaseClient } from './supabase'

export async function saveToCloud(data) {
  const supabase = getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be logged in to save to cloud.')
  }

  const { error } = await supabase.from('user_data').upsert({
    user_id: user.id,
    payload: data,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })

  if (error) {
    throw error
  }
}

export async function loadFromCloud() {
  const supabase = getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('You must be logged in to restore from cloud.')
  }

  const { data, error } = await supabase
    .from('user_data')
    .select('payload')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }

  return data?.payload ?? null
}