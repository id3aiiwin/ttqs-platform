import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('company_id')
  if (!companyId) return NextResponse.json([])

  const sc = createServiceClient()
  const { data } = await sc.from('departments')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('sort_order')

  return NextResponse.json(data ?? [])
}
