import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

export async function POST(request: NextRequest) {
  // 權限驗證：只有 consultant 和 admin 可輸入
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant' && profile?.role !== 'admin') {
    return NextResponse.json({ error: '僅顧問或行政人員可輸入評量資料' }, { status: 403 })
  }

  const body = await request.json()
  const { profile_id, drives, brain_regions, assessment_date, assessment_version, assessment_spending, notes } = body

  if (!profile_id || !drives) return NextResponse.json({ error: '缺少必要參數' }, { status: 400 })

  const sc = createServiceClient()

  // 檢查是否已有評量
  const { data: existing } = await sc.from('talent_assessments')
    .select('id')
    .eq('profile_id', profile_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    // 更新現有
    const { error } = await sc.from('talent_assessments').update({
      drives,
      brain_regions: brain_regions ?? {},
      assessment_date: assessment_date ?? null,
      assessment_version: assessment_version ?? null,
      assessment_spending: assessment_spending ?? 0,
      assessor_id: user.id,
      assessor_name: profile.full_name ?? null,
      notes: notes ?? null,
    }).eq('id', existing.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    // 建立新的
    const { error } = await sc.from('talent_assessments').insert({
      profile_id,
      drives,
      brain_regions: brain_regions ?? {},
      assessment_date: assessment_date ?? null,
      assessment_version: assessment_version ?? null,
      assessment_spending: assessment_spending ?? 0,
      assessor_id: user.id,
      assessor_name: profile.full_name ?? null,
      notes: notes ?? null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
