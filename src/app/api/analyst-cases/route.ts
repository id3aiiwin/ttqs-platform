import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const sc = createServiceClient()
  const { error } = await sc.from('analyst_cases').insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const { id, ...updates } = await request.json()
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const sc = createServiceClient()
  const { error } = await sc.from('analyst_cases').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const sc = createServiceClient()
  const { error } = await sc.from('analyst_cases').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
