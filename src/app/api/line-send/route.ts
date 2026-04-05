import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '僅顧問可發送通知' }, { status: 403 })
  }

  const { template_id, message, recipients, category, context_type, context_id, variables } = await request.json()

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: '缺少收件人' }, { status: 400 })
  }
  if (!category) {
    return NextResponse.json({ error: '缺少分類' }, { status: 400 })
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'LINE Channel Access Token 未設定' }, { status: 500 })

  const sc = createServiceClient()

  // Resolve message content
  let finalMessage = message || ''
  if (template_id) {
    const { data: tmpl } = await sc.from('line_message_templates').select('content').eq('id', template_id).single()
    if (tmpl) {
      finalMessage = variables ? replaceVariables(tmpl.content, variables) : tmpl.content
    }
  }

  if (!finalMessage) {
    return NextResponse.json({ error: '缺少訊息內容' }, { status: 400 })
  }

  // Filter valid LINE user IDs
  const lineUserIds = recipients
    .map((r: { line_user_id: string }) => r.line_user_id)
    .filter(Boolean) as string[]

  let recipientCount = 0
  let failedCount = 0

  if (lineUserIds.length > 0) {
    if (lineUserIds.length === 1) {
      // Push to single user
      try {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: lineUserIds[0],
            messages: [{ type: 'text', text: finalMessage }],
          }),
        })
        if (res.ok) {
          recipientCount = 1
        } else {
          failedCount = 1
          console.error('LINE push error:', await res.json())
        }
      } catch (err) {
        failedCount = 1
        console.error('LINE push error:', err)
      }
    } else {
      // Multicast (max 500)
      try {
        const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: lineUserIds.slice(0, 500),
            messages: [{ type: 'text', text: finalMessage }],
          }),
        })
        if (res.ok) {
          recipientCount = lineUserIds.length
        } else {
          failedCount = lineUserIds.length
          console.error('LINE multicast error:', await res.json())
        }
      } catch (err) {
        failedCount = lineUserIds.length
        console.error('LINE multicast error:', err)
      }
    }
  }

  // Build recipient name summary
  const recipientNames = recipients
    .map((r: { name?: string }) => r.name)
    .filter(Boolean)
    .slice(0, 5)
    .join('、')
  const recipientName = recipients.length > 5
    ? `${recipientNames} 等 ${recipients.length} 人`
    : recipientNames || `${recipients.length} 人`

  // Log send
  await sc.from('line_send_logs').insert({
    template_id: template_id || null,
    category,
    recipient_type: category,
    recipient_name: recipientName,
    recipient_count: recipientCount,
    failed_count: failedCount,
    message_content: finalMessage,
    context_type: context_type || null,
    context_id: context_id || null,
    sent_by: user.id,
    sent_by_name: profile.full_name || profile.email,
  })

  return NextResponse.json({
    ok: true,
    recipientCount,
    failedCount,
    totalRecipients: recipients.length,
    lineLinked: lineUserIds.length,
    notLinked: recipients.length - lineUserIds.length,
  })
}
