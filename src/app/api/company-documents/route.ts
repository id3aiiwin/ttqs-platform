import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const { document_id, filled_content } = await request.json()
  if (!document_id) return NextResponse.json({ error: '缺少 document_id' }, { status: 400 })

  const sc = createServiceClient()
  const { error } = await sc.from('company_documents')
    .update({ filled_content })
    .eq('id', document_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
