import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  const sc = createServiceClient()

  const { error } = await sc.from('instructor_extra_hours').insert({
    ...body,
    added_by: user?.id ?? null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 更新講師累計時數
  if (body.instructor_id && body.hours) {
    const { data: profile } = await sc.from('profiles').select('accumulated_hours').eq('id', body.instructor_id).single()
    if (profile) {
      await sc.from('profiles').update({
        accumulated_hours: (profile.accumulated_hours ?? 0) + Number(body.hours),
      }).eq('id', body.instructor_id)
    }
  }

  return NextResponse.json({ ok: true })
}
