import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = request.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'missing path' }, { status: 400 })

  const sc = createServiceClient()
  const { data, error } = await sc.storage.from('documents').createSignedUrl(path, 3600) // 1 hour

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'failed' }, { status: 500 })
  }

  return NextResponse.redirect(data.signedUrl)
}
