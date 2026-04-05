import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const sc = createServiceClient()
  const { error } = await sc.from('course_templates_v2').insert({ ...body, created_by: user?.id ?? null })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  const sc = createServiceClient()
  const { error } = await sc.from('course_templates_v2').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
