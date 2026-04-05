import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

/**
 * POST /api/line-notify
 * body: { course_id, custom_message? }
 * 發送 LINE 上課通知給課程學員
 */
export async function POST(request: NextRequest) {
  // 權限驗證
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') {
    return NextResponse.json({ error: '僅顧問可發送通知' }, { status: 403 })
  }

  const { course_id, custom_message } = await request.json()
  if (!course_id) return NextResponse.json({ error: '缺少 course_id' }, { status: 400 })

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'LINE Channel Access Token 未設定' }, { status: 500 })

  const sc = createServiceClient()

  // 取得課程資訊
  const { data: course } = await sc.from('courses').select('title, start_date, hours, trainer, company_id').eq('id', course_id).single()
  if (!course) return NextResponse.json({ error: '找不到課程' }, { status: 404 })

  // 取得學員 LINE user IDs
  const { data: enrollments } = await sc.from('course_enrollments').select('employee_id').eq('course_id', course_id)
  const empIds = (enrollments ?? []).map(e => e.employee_id)

  if (empIds.length === 0) {
    // 如果沒有 enrollment，取該企業所有員工
    const { data: employees } = course.company_id ? await sc.from('profiles').select('id').eq('company_id', course.company_id) : { data: [] }
    empIds.push(...(employees ?? []).map(e => e.id))
  }

  const { data: profiles } = empIds.length > 0
    ? await sc.from('profiles').select('line_user_id').in('id', empIds).not('line_user_id', 'is', null)
    : { data: [] }

  const lineUserIds = (profiles ?? []).map(p => p.line_user_id).filter(Boolean) as string[]

  // 組裝訊息
  const message = custom_message || `📚 上課通知\n\n課程：${course.title}\n日期：${course.start_date ?? '待定'}\n時數：${course.hours ?? '—'} 小時\n講師：${course.trainer ?? '待定'}\n\n請準時出席，謝謝！`

  let recipientCount = 0
  let failedCount = 0

  if (lineUserIds.length > 0) {
    // LINE Messaging API multicast（最多 500 人）
    try {
      const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: lineUserIds.slice(0, 500),
          messages: [{ type: 'text', text: message }],
        }),
      })

      if (res.ok) {
        recipientCount = lineUserIds.length
      } else {
        const err = await res.json()
        failedCount = lineUserIds.length
        console.error('LINE API error:', err)
      }
    } catch (err) {
      failedCount = lineUserIds.length
      console.error('LINE send error:', err)
    }
  }

  // 記錄通知
  await sc.from('line_notifications').insert({
    course_id,
    sent_by: user.id,
    message,
    recipient_count: recipientCount,
    failed_count: failedCount,
  })

  return NextResponse.json({
    ok: true,
    recipientCount,
    failedCount,
    totalStudents: empIds.length,
    lineLinked: lineUserIds.length,
    notLinked: empIds.length - lineUserIds.length,
  })
}
