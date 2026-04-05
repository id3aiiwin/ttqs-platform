import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { trainer_name, message } = await request.json()
  if (!trainer_name || !message) return NextResponse.json({ error: '缺少參數' }, { status: 400 })

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'LINE Token 未設定' }, { status: 500 })

  const sc = createServiceClient()

  // 用講師名稱找到 profile 的 line_user_id
  const { data: instructor } = await sc.from('profiles')
    .select('line_user_id, full_name')
    .eq('full_name', trainer_name)
    .single()

  if (!instructor?.line_user_id) {
    return NextResponse.json({ error: `找不到講師「${trainer_name}」的 LINE User ID，請確認講師已在個人設定綁定 LINE` }, { status: 400 })
  }

  // 發送 LINE 訊息
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: instructor.line_user_id,
        messages: [{ type: 'text', text: message }],
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: `LINE 發送失敗：${JSON.stringify(err)}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: `發送錯誤：${(err as Error).message}` }, { status: 500 })
  }
}
