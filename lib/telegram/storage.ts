// lib/telegram/storage.ts
// grammY StorageAdapter backed by the telegram_sessions Supabase table.
// read returns undefined (not throws) when no row found.
// write upserts. delete deletes. DB errors are thrown and caught by the webhook route.

import type { StorageAdapter } from 'grammy'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export function createStorageAdapter(): StorageAdapter<unknown> {
  return {
    async read(key: string) {
      const chatId = Number(key)
      if (!Number.isFinite(chatId)) throw new Error(`Invalid session key: "${key}"`)
      const supabase = createServiceSupabaseClient()
      const { data, error } = await supabase
        .from('telegram_sessions')
        .select('session_data')
        .eq('chat_id', chatId)
        .single()

      // PGRST116 = "no rows returned" — not an error, just no session yet
      if (error) {
        if (error.code === 'PGRST116') return undefined
        throw new Error(error.message)
      }
      return data?.session_data
    },

    async write(key: string, value: unknown) {
      const chatId = Number(key)
      if (!Number.isFinite(chatId)) throw new Error(`Invalid session key: "${key}"`)
      const supabase = createServiceSupabaseClient()
      const { error } = await supabase
        .from('telegram_sessions')
        .upsert({
          chat_id: chatId,
          session_data: value,
          updated_at: new Date().toISOString(),
        })
      if (error) throw new Error(error.message)
    },

    async delete(key: string) {
      const chatId = Number(key)
      if (!Number.isFinite(chatId)) throw new Error(`Invalid session key: "${key}"`)
      const supabase = createServiceSupabaseClient()
      const { error } = await supabase
        .from('telegram_sessions')
        .delete()
        .eq('chat_id', chatId)
      if (error) throw new Error(error.message)
    },
  }
}
