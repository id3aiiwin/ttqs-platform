import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { course_id, material_submit_date, teaching_log_submit_date, checklist_items, checklist_checked } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'missing course_id' }, { status: 400 })

  const sc = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  // 更新課程教材日期
  await sc.from('courses').update({
    material_submit_date: material_submit_date || null,
    teaching_log_submit_date: teaching_log_submit_date || null,
  }).eq('id', course_id)

  // 更新行政檢核
  const { data: existing } = await sc.from('admin_checklists').select('id').eq('course_id', course_id).single()
  if (existing) {
    await sc.from('admin_checklists').update({
      items: checklist_items,
      checked: checklist_checked,
      updated_by: user?.id ?? null,
    }).eq('id', existing.id)
  } else {
    await sc.from('admin_checklists').insert({
      course_id,
      items: checklist_items,
      checked: checklist_checked,
      updated_by: user?.id ?? null,
    })
  }

  return NextResponse.json({ ok: true })
}
