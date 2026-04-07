import { cache } from 'react'
import { createServiceClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

/**
 * 用 service role 繞過 RLS 查詢 profile。
 * 使用 React cache() 確保同一個 request 內只查一次。
 * 錯誤時回傳 null，讓呼叫端統一用 redirect 處理。
 */
export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  } catch {
    return null
  }
})
