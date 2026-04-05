import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const sc = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ notifications: [] })

  const { data } = await sc.from('notifications')
    .select('id, message, icon, is_read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ notifications: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  const { id, mark_all_read } = await request.json()
  const sc = createServiceClient()
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (mark_all_read && user) {
    await sc.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  } else if (id) {
    await sc.from('notifications').update({ is_read: true }).eq('id', id)
  }

  return NextResponse.json({ ok: true })
}
