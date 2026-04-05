import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const sc = createServiceClient()

  const { error } = await sc.from('company_signers').insert({
    company_id: body.company_id,
    signer_role: body.signer_role,
    signer_name: body.signer_name ?? null,
    sort_order: body.sort_order ?? 0,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const sc = createServiceClient()
  const { error } = await sc.from('company_signers').update(updates).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
