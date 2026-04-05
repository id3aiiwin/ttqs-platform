import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const { course_id, file_url } = await request.json()
  const sc = createServiceClient()

  const { data, error } = await sc.from('course_photos').insert({
    course_id, file_url, uploaded_by: user?.id ?? null,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 連動 DO 構面表單（上課照片是指標 12 佐證）
  const { data: photos } = await sc.from('course_photos').select('id').eq('course_id', course_id)
  if (photos && photos.length >= 2) {
    await sc.from('course_forms')
      .update({ status: 'in_progress' })
      .eq('course_id', course_id)
      .eq('standard_name', '公告')
      .eq('status', 'pending')
  }

  return NextResponse.json({ id: data.id })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  const sc = createServiceClient()
  await sc.from('course_photos').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
