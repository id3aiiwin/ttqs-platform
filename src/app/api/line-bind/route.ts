import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email, line_user_id } = await request.json()

  if (!email || !line_user_id) {
    return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })
  }

  const sc = createServiceClient()

  // 用 email 找到 profile
  const { data: profile, error } = await sc.from('profiles')
    .select('id, full_name, email, line_user_id')
    .eq('email', email.trim().toLowerCase())
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: '找不到此 Email 的帳號，請確認是否為平台註冊的 Email' }, { status: 404 })
  }

  // 檢查是否已經綁定相同的 LINE
  if (profile.line_user_id === line_user_id) {
    return NextResponse.json({ ok: true, name: profile.full_name, message: '已經綁定過了' })
  }

  // 更新 line_user_id
  const { error: updateError } = await sc.from('profiles')
    .update({ line_user_id })
    .eq('id', profile.id)

  if (updateError) {
    return NextResponse.json({ error: '綁定失敗：' + updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, name: profile.full_name })
}
