import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { profile_id, ...updates } = body
  if (!profile_id) return NextResponse.json({ error: 'missing profile_id' }, { status: 400 })

  const sc = createServiceClient()

  const updateData: Record<string, unknown> = {}
  if (updates.signature_url !== undefined) updateData.signature_url = updates.signature_url
  if (updates.line_user_id !== undefined) updateData.line_user_id = updates.line_user_id

  const { error } = await sc.from('profiles').update(updateData).eq('id', profile_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
