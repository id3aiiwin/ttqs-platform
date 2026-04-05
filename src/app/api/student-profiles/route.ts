import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

/**
 * POST: Create or update student profile (pre-register with email)
 * PATCH: Update existing profile
 */

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '僅顧問或行政人員可操作' }, { status: 403 })
  }

  const body = await request.json()
  const { full_name, email, phone, birthday, gender, company_id, job_title, role, r1_pattern, l2_pattern, customer_level } = body

  if (!email) return NextResponse.json({ error: '缺少 email' }, { status: 400 })

  const sc = createServiceClient()

  // Check if profile already exists by email
  const { data: existing } = await sc.from('profiles').select('id').eq('email', email).single()

  if (existing) {
    // Update existing
    const { error } = await sc.from('profiles').update({
      full_name: full_name || null,
      phone: phone || null,
      birthday: birthday || null,
      gender: gender || null,
      company_id: company_id || null,
      job_title: job_title || null,
      r1_pattern: r1_pattern || null,
      l2_pattern: l2_pattern || null,
      customer_level: customer_level || null,
    }).eq('id', existing.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, action: 'updated', id: existing.id })
  }

  // Create auth user with temp password (email_confirm = true so they can reset later)
  const { data: authUser, error: authError } = await sc.auth.admin.createUser({
    email,
    password: 'id3a',
    email_confirm: true,
    user_metadata: { full_name: full_name || '' },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  if (authUser?.user) {
    // Update the auto-created profile with full data
    await sc.from('profiles').update({
      full_name: full_name || null,
      role: ((role as string) || 'student') as 'consultant' | 'admin' | 'instructor' | 'supervisor' | 'analyst' | 'hr' | 'manager' | 'employee' | 'student',
      roles: [(role as string) || 'student'],
      phone: phone || null,
      birthday: birthday || null,
      gender: gender || null,
      company_id: company_id || null,
      job_title: job_title || null,
      r1_pattern: r1_pattern || null,
      l2_pattern: l2_pattern || null,
      customer_level: customer_level || null,
    }).eq('id', authUser.user.id)
  }

  return NextResponse.json({ ok: true, action: 'created', id: authUser?.user?.id })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '僅顧問或行政人員可操作' }, { status: 403 })
  }

  const body = await request.json()
  const { id, ...fields } = body

  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 })

  const sc = createServiceClient()

  // Build update payload - only include provided fields
  const update: Record<string, unknown> = {}
  const allowedFields = ['full_name', 'phone', 'birthday', 'gender', 'company_id', 'job_title', 'r1_pattern', 'l2_pattern', 'customer_level', 'is_personal_client']
  for (const key of allowedFields) {
    if (key in fields) update[key] = fields[key] ?? null
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: '沒有要更新的欄位' }, { status: 400 })

  const { error } = await sc.from('profiles').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
