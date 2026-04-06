import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { getUser } from '@/lib/get-user'
import { EmployeesClient } from './employees-client'

export const metadata = { title: '員工管理 | ID3A 管理平台' }

export default async function EmployeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin', 'hr', 'manager'].includes(profile.role)) redirect('/dashboard')
  const isConsultant = profile.role === 'consultant' || profile.role === 'admin'

  const sc = createServiceClient()

  const [{ data: company }, { data: employees }, { data: departments }] = await Promise.all([
    sc.from('companies').select('id, name').eq('id', companyId).single(),
    sc.from('profiles')
      .select('id, full_name, email, role, department_id, job_title, hire_date, birthday, r1_pattern, l2_pattern, created_at')
      .eq('company_id', companyId)
      .order('created_at'),
    sc.from('departments').select('id, name').eq('company_id', companyId),
  ])

  if (!company) notFound()

  // 取得每位員工的課程完成統計
  const empIds = (employees ?? []).map(e => e.id)
  const { data: enrollments } = empIds.length > 0
    ? await sc.from('course_enrollments').select('employee_id, status').in('employee_id', empIds)
    : { data: [] }

  const enrollStats: Record<string, { total: number; completed: number }> = {}
  enrollments?.forEach(e => {
    if (!enrollStats[e.employee_id]) enrollStats[e.employee_id] = { total: 0, completed: 0 }
    enrollStats[e.employee_id].total++
    if (e.status === 'completed') enrollStats[e.employee_id].completed++
  })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${companyId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回工作區
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">員工管理</h1>
        <p className="text-gray-500 text-sm mt-1">{company.name} · {employees?.length ?? 0} 人</p>
      </div>

      <EmployeesClient
        employees={employees ?? []}
        departments={departments ?? []}
        companyId={companyId}
        companyName={company.name}
        isConsultant={isConsultant}
        enrollStats={enrollStats}
      />
    </div>
  )
}
