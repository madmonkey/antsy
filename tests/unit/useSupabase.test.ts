import { describe, expect, it, vi } from 'vitest'
import { useSupabase } from '../../app/composables/useSupabase'

describe('useSupabase', () => {
  it('throws an error when Supabase configuration is missing', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { supabaseUrl: '', supabasePublishableKey: '' } }))
    await expect(useSupabase()).rejects.toThrow(/Supabase is not configured/)
  })

  it('initializes and reuses Supabase client when configured', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: {
        supabaseUrl: 'https://example.supabase.co',
        supabasePublishableKey: 'test-publishable-key'
      }
    }))
    const client1 = await useSupabase()
    const client2 = await useSupabase()
    expect(client1).toBeDefined()
    expect(client1).toBe(client2)
  })
})
