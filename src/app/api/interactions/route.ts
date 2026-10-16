import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

async function requireAuth() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const sc = createServiceClient()

  const { error } = await sc.from('interactions').insert({ ...body, created_by: user.id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 如果有 next_action + next_action_date，自動建立待辦
  if (body.next_action && body.next_action_date) {
    await sc.from('todos').insert({
      title: body.next_action,
      due_date: body.next_action_date,
      type: 'followup',
      related_type: body.target_type,
      related_id: body.target_id,
      related_name: body.target_name,
      source: 'interaction',
      priority: 'high',
      assigned_to: user.id,
      created_by: user.id,
    })
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, ...updates } = await request.json()
  const sc = createServiceClient()
  const { error } = await sc.from('interactions').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const user = await requireAuth()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await request.json()
  const sc = createServiceClient()
  const { error } = await sc.from('interactions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
