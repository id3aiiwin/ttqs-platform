import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const sc = createServiceClient()
  const category = request.nextUrl.searchParams.get('category')

  let query = sc.from('line_message_templates').select('*').order('is_default', { ascending: false }).order('created_at', { ascending: true })
  if (category && ['instructor', 'student', 'client'].includes(category)) {
    query = query.eq('category', category as 'instructor' | 'student' | 'client')
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const { category, name, content, description, variables } = await request.json()
  if (!category || !name || !content) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 })
  }

  const sc = createServiceClient()
  const { data, error } = await sc.from('line_message_templates').insert({
    category,
    name,
    content,
    description: description || null,
    variables: variables || [],
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const { id, name, content, description, variables } = await request.json()
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const sc = createServiceClient()
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name
  if (content !== undefined) updates.content = content
  if (description !== undefined) updates.description = description
  if (variables !== undefined) updates.variables = variables

  const { data, error } = await sc.from('line_message_templates').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const sc = createServiceClient()

  // Check if it's a default template
  const { data: tmpl } = await sc.from('line_message_templates').select('is_default').eq('id', id).single()
  if (tmpl?.is_default) {
    return NextResponse.json({ error: '預設模板不可刪除' }, { status: 400 })
  }

  const { error } = await sc.from('line_message_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
