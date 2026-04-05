import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) || 'general'

  if (!file) return NextResponse.json({ error: '未選擇檔案' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const sc = createServiceClient()
  const { data, error } = await sc.storage
    .from('documents')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = sc.storage.from('documents').getPublicUrl(data.path)

  return NextResponse.json({
    path: data.path,
    url: urlData.publicUrl,
    fileName: file.name,
  })
}
