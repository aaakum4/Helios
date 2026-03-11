import { supabase } from './supabase'

export async function saveToCloud(data) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('user_data').upsert({
    user_id: user.id,
    payload: data,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
}

export async function loadFromCloud() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('user_data')
    .select('payload')
    .single()

  return data?.payload ?? null
}