import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email, profile_id, line_user_id } = await request.json()

  if ((!email && !profile_id) || !line_user_id) {
    return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })
  }

  const sc = createServiceClient()

  // 用 profile_id 或 email 找到 profile
  const query = sc.from('profiles').select('id, full_name, email, line_user_id')
  if (profile_id) {
    query.eq('id', profile_id)
  } else {
    query.eq('email', email.trim().toLowerCase())
  }
  const { data: profile, error } = await query.single()

  if (error || !profile) {
    return NextResponse.json({ error: '找不到對應的帳號' }, { status: 404 })
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
