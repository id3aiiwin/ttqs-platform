import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

/**
 * 快取版 getUser：同一個 request 內只查一次 auth。
 * Layout 和子頁面共用同一個結果。
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
