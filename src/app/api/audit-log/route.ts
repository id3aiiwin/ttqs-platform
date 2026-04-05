import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, user_name, action, entity_type, entity_id, details } = body

    if (!action || !entity_type) {
      return NextResponse.json({ error: 'action and entity_type are required' }, { status: 400 })
    }

    const sc = createServiceClient()
    const { error } = await sc.from('audit_logs').insert({
      user_id: user_id ?? null,
      user_name: user_name ?? null,
      action,
      entity_type,
      entity_id: entity_id ?? null,
      details: details ?? {},
    })

    if (error) {
      console.error('Audit log insert error:', error)
      return NextResponse.json({ error: 'Failed to write audit log' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Audit log error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const params = req.nextUrl.searchParams
  const page = parseInt(params.get('page') || '1')
  const limit = parseInt(params.get('limit') || '50')
  const entityType = params.get('entity_type')
  const userId = params.get('user_id')
  const offset = (page - 1) * limit

  const sc = createServiceClient()
  let query = sc.from('audit_logs').select('*', { count: 'exact' })

  if (entityType) query = query.eq('entity_type', entityType)
  if (userId) query = query.eq('user_id', userId)

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Audit log query error:', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit })
}
