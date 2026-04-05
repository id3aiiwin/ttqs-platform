import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  if (!body.course_id) return NextResponse.json({ error: '缺少 course_id' }, { status: 400 })

  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  const sc = createServiceClient()
  let authorName = null
  if (user) {
    const { data: profile } = await sc.from('profiles').select('full_name').eq('id', user.id).single()
    authorName = profile?.full_name ?? null
  }

  const { error } = await sc.from('course_tracking').insert({
    ...body,
    recorded_by: user?.id ?? null,
    recorded_by_name: authorName,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
