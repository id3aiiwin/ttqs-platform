import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * 快取版 getUser：同一個 request 內只查一次 auth。
 * Layout 和子頁面共用同一個結果。
 * 錯誤時回傳 null 而非拋出例外，讓呼叫端統一用 redirect 處理。
 */
export const getUser = cache(async () => {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
})
