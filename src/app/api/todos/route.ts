import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const sc = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const { error } = await sc.from('todos').insert({ ...body, created_by: user?.id ?? null, assigned_to: body.assigned_to ?? user?.id ?? null })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json()
  const sc = createServiceClient()
  if (updates.status === 'completed') updates.completed_at = new Date().toISOString()
  const { error } = await sc.from('todos').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  const sc = createServiceClient()
  const { error } = await sc.from('todos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
