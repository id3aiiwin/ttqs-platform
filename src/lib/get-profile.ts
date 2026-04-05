import { createServiceClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

/**
 * 用 service role 繞過 RLS 查詢 profile。
 * 呼叫前必須已用 supabase.auth.getUser() 驗證身份。
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return data
}
