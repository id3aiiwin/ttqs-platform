import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

/**
 * GET /api/profiles?company_id=xxx  — employees of a company
 * GET /api/profiles?all=true        — all profiles (for public courses)
 * Returns: [{ id, full_name, email }]
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const companyId = request.nextUrl.searchParams.get('company_id')
  const all = request.nextUrl.searchParams.get('all')

  const sc = createServiceClient()

  let query = sc.from('profiles').select('id, full_name, email').order('full_name')

  if (companyId) {
    query = query.eq('company_id', companyId)
  } else if (!all) {
    return NextResponse.json({ error: 'missing company_id or all flag' }, { status: 400 })
  }

  // For non-consultant roles, exclude consultant profiles from the list
  query = query.neq('role', 'consultant')

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
