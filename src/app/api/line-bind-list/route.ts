import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const courseId = searchParams.get('course_id')
  const companyId = searchParams.get('company_id')

  if (!courseId && !companyId) {
    return NextResponse.json({ error: '缺少參數' }, { status: 400 })
  }

  const sc = createServiceClient()

  if (courseId) {
    // 取得該課程的參訓學員
    const { data: enrollments } = await sc
      .from('course_enrollments')
      .select('employee_id')
      .eq('course_id', courseId)

    const employeeIds = (enrollments ?? []).map(e => e.employee_id).filter(Boolean) as string[]

    if (employeeIds.length === 0) {
      return NextResponse.json({ students: [] })
    }

    const { data: profiles } = await sc
      .from('profiles')
      .select('id, full_name, line_user_id')
      .in('id', employeeIds)
      .order('full_name')

    const students = (profiles ?? []).map(p => ({
      id: p.id,
      name: p.full_name ?? '未設定姓名',
      bound: !!p.line_user_id,
    }))

    return NextResponse.json({ students })
  }

  // 取得該企業的所有員工
  const { data: profiles } = await sc
    .from('profiles')
    .select('id, full_name, line_user_id')
    .eq('company_id', companyId!)
    .order('full_name')

  const students = (profiles ?? []).map(p => ({
    id: p.id,
    name: p.full_name ?? '未設定姓名',
    bound: !!p.line_user_id,
  }))

  return NextResponse.json({ students })
}
