import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { course_id, action, reject_reason, trainer, hours } = await request.json()
  if (!course_id || !action) return NextResponse.json({ error: '缺少參數' }, { status: 400 })

  const sc = createServiceClient()

  if (action === 'approve') {
    // 核准課程
    await sc.from('courses').update({
      review_status: 'approved',
      is_counted_in_hours: true,
    }).eq('id', course_id)

    // 自動累計講師時數
    if (trainer && hours) {
      const { data: instructorProfile } = await sc.from('profiles')
        .select('id, accumulated_hours')
        .eq('full_name', trainer)
        .single()

      if (instructorProfile) {
        await sc.from('profiles').update({
          accumulated_hours: (instructorProfile.accumulated_hours ?? 0) + Number(hours),
        }).eq('id', instructorProfile.id)
      }
    }

    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    await sc.from('courses').update({
      review_status: 'rejected',
      reject_reason: reject_reason ?? null,
      is_counted_in_hours: false,
    }).eq('id', course_id)

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
