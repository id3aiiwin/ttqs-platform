import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { course_id, note_type, content, employee_id, employee_name } = await request.json()
  if (!course_id || !content) return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const sc = createServiceClient()

  // 取得作者名稱
  let authorName = null
  if (user) {
    const { data: profile } = await sc.from('profiles').select('full_name').eq('id', user.id).single()
    authorName = profile?.full_name ?? null
  }

  const { error } = await sc.from('course_notes').insert({
    course_id,
    author_id: user?.id ?? null,
    author_name: authorName,
    note_type: note_type ?? 'observation',
    content,
    is_internal: true,
    employee_id: employee_id ?? null,
    employee_name: employee_name ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const { note_id } = await request.json()
  if (!note_id) return NextResponse.json({ error: '缺少 note_id' }, { status: 400 })

  const sc = createServiceClient()
  const { error } = await sc.from('course_notes').delete().eq('id', note_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
