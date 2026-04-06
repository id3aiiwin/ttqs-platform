import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') return NextResponse.json({ error: '僅總管理可修改角色' }, { status: 403 })

  const { user_id, roles, primary_role, r1_pattern, l2_pattern, scheduled_assessment_date } = await request.json()
  if (!user_id) return NextResponse.json({ error: '參數錯誤' }, { status: 400 })

  const sc = createServiceClient()

  // Build update payload
  const updateData: Record<string, unknown> = {}
  if (roles && roles.length > 0) {
    // Preserve the highest-priority role: if user already has consultant role and it's still selected, keep it
    const sc2 = createServiceClient()
    const { data: targetProfile } = await sc2.from('profiles').select('role').eq('id', user_id).single()
    const currentRole = targetProfile?.role
    if (currentRole && roles.includes(currentRole)) {
      updateData.role = primary_role && roles.includes(primary_role) ? primary_role : currentRole
    } else {
      updateData.role = primary_role || roles[0]
    }
    updateData.roles = roles
  }
  if (r1_pattern !== undefined) updateData.r1_pattern = r1_pattern
  if (l2_pattern !== undefined) updateData.l2_pattern = l2_pattern
  if (scheduled_assessment_date !== undefined) updateData.scheduled_assessment_date = scheduled_assessment_date

  if (Object.keys(updateData).length === 0) return NextResponse.json({ error: '無更新欄位' }, { status: 400 })

  const { error } = await sc.from('profiles').update(updateData).eq('id', user_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
