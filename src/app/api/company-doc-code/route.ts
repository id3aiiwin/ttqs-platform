import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { company_id, doc_code } = await request.json()
  const sc = createServiceClient()
  const { error } = await sc.from('companies')
    .update({ doc_code } as never)
    .eq('id', company_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
