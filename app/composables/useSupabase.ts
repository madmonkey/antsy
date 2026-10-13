import type { SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export async function useSupabase(): Promise<SupabaseClient> {
  if (client) return client
  const { supabaseUrl, supabasePublishableKey } = useRuntimeConfig().public
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase is not configured: set NUXT_PUBLIC_SUPABASE_URL and NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.')
  }
  const { createClient } = await import('@supabase/supabase-js')
  client = createClient(supabaseUrl, supabasePublishableKey)
  return client
}
