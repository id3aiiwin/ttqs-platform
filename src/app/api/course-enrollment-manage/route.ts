import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

/**
 * GET /api/course-enrollment-manage?course_id=xxx
 * Returns enrolled students for a course with profile info
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const courseId = request.nextUrl.searchParams.get('course_id')
  if (!courseId) return NextResponse.json({ error: 'missing course_id' }, { status: 400 })

  const sc = createServiceClient()

  // Get enrollments
  const { data: enrollments, error } = await sc
    .from('course_enrollments')
    .select('id, employee_id, status, completion_date, score')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!enrollments || enrollments.length === 0) {
    return NextResponse.json([])
  }

  // Get profile info for enrolled students
  const employeeIds = enrollments.map(e => e.employee_id)
  const { data: profiles } = await sc
    .from('profiles')
    .select('id, full_name, email')
    .in('id', employeeIds)

  const profileMap: Record<string, { full_name: string | null; email: string }> = {}
  profiles?.forEach(p => { profileMap[p.id] = { full_name: p.full_name, email: p.email } })

  const result = enrollments.map(e => ({
    id: e.id,
    employee_id: e.employee_id,
    full_name: profileMap[e.employee_id]?.full_name ?? null,
    email: profileMap[e.employee_id]?.email ?? '',
    status: e.status,
    completion_date: e.completion_date,
    score: e.score,
  }))

  return NextResponse.json(result)
}

/**
 * POST /api/course-enrollment-manage
 * Add students to course
 * Body: { course_id, employee_ids: string[] }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const { course_id, employee_ids } = await request.json()
  if (!course_id || !employee_ids?.length) {
    return NextResponse.json({ error: 'missing course_id or employee_ids' }, { status: 400 })
  }

  const sc = createServiceClient()

  // Get company_id from the course
  const { data: course } = await sc.from('courses').select('company_id').eq('id', course_id).single()
  const companyId = course?.company_id ?? ''

  // Upsert enrollments
  const rows = employee_ids.map((eid: string) => ({
    course_id,
    employee_id: eid,
    company_id: companyId,
    status: 'enrolled',
  }))

  const { error } = await sc
    .from('course_enrollments')
    .upsert(rows, { onConflict: 'course_id,employee_id', ignoreDuplicates: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/course-enrollment-manage
 * Remove student from course
 * Body: { course_id, employee_id }
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || (profile.role !== 'consultant' && profile.role !== 'admin')) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const { course_id, employee_id } = await request.json()
  if (!course_id || !employee_id) {
    return NextResponse.json({ error: 'missing course_id or employee_id' }, { status: 400 })
  }

  const sc = createServiceClient()
  const { error } = await sc
    .from('course_enrollments')
    .delete()
    .eq('course_id', course_id)
    .eq('employee_id', employee_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
