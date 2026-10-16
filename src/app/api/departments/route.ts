import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const companyId = request.nextUrl.searchParams.get('company_id')
  if (!companyId) return NextResponse.json([])

  const sc = createServiceClient()
  const { data } = await sc.from('departments')
    .select('id, name, parent_id')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('sort_order')

  return NextResponse.json(data ?? [])
}
