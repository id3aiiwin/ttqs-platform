import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const sc = createServiceClient()
  const { data } = await sc.from('knowledge_base_templates')
    .select('id, name, tier, pddro_phase, ttqs_indicator, review_reminders, document_type')
    .order('tier')
    .order('name')

  return NextResponse.json(data ?? [])
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, ...updateFields } = body
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const sc = createServiceClient()

  // 只更新傳入的欄位
  const updateData: Record<string, unknown> = {}
  if (updateFields.file_url !== undefined) updateData.file_url = updateFields.file_url
  if (updateFields.auto_replace_rules !== undefined) updateData.auto_replace_rules = updateFields.auto_replace_rules
  if (updateFields.review_reminders !== undefined) updateData.review_reminders = updateFields.review_reminders
  if (updateFields.content !== undefined) updateData.content = updateFields.content
  if (updateFields.structured_content !== undefined) updateData.structured_content = updateFields.structured_content
  if (updateFields.allowed_companies !== undefined) updateData.allowed_companies = updateFields.allowed_companies

  const { error } = await sc.from('knowledge_base_templates')
    .update(updateData)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
