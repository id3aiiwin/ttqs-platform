import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '員工管理 | ID3A 管理平台' }

const ROLE_LABELS: Record<string, string> = { consultant: '顧問', hr: 'HR', manager: '主管', employee: '員工' }

export default async function EmployeesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin', 'hr', 'manager'].includes(profile.role)) redirect('/dashboard')
  const isConsultant = profile.role === 'consultant' || profile.role === 'admin'

  const sc = createServiceClient()

  const { data: company } = await sc.from('companies').select('id, name').eq('id', companyId).single()
  if (!company) notFound()

  const { data: employees } = await sc.from('profiles')
    .select('id, full_name, email, role, department_id, job_title, hire_date, birthday, r1_pattern, l2_pattern, created_at')
    .eq('company_id', companyId)
    .order('created_at')

  const { data: departments } = await sc.from('departments').select('id, name').eq('company_id', companyId)
  const deptMap: Record<string, string> = {}
  departments?.forEach(d => { deptMap[d.id] = d.name })

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
    <div className="p-8 max-w-4xl mx-auto">
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">員工列表</p>
            <Link href={`/companies/${companyId}/organization`} className="text-xs text-indigo-600 hover:text-indigo-700">
              組織架構 / 批次匯入
            </Link>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          {!employees || employees.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">尚無員工</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">姓名</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">部門</th>
                  <th className="px-4 py-3 text-left">職稱</th>
                  <th className="px-4 py-3 text-left">生日</th>
                  {isConsultant && <th className="px-4 py-3 text-left">R1 管理力</th>}
                  {isConsultant && <th className="px-4 py-3 text-left">L2 心像力</th>}
                  <th className="px-4 py-3 text-left">年資</th>
                  <th className="px-4 py-3 text-left">學習履歷</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map(emp => {
                  const stats = enrollStats[emp.id] ?? { total: 0, completed: 0 }
                  return (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-indigo-700">{(emp.full_name || emp.email).charAt(0)}</span>
                          </div>
                          <span className="font-medium text-gray-900">{emp.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{emp.email}</td>
                      <td className="px-4 py-3 text-gray-500">{deptMap[emp.department_id ?? ''] ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{emp.job_title ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{emp.birthday ?? '—'}</td>
                      {isConsultant && <td className="px-4 py-3 text-xs text-gray-700 font-medium">{emp.r1_pattern ?? '—'}</td>}
                      {isConsultant && <td className="px-4 py-3 text-xs text-gray-700 font-medium">{emp.l2_pattern ?? '—'}</td>}
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {emp.hire_date ? (() => {
                          const years = Math.floor((new Date().getTime() - new Date(emp.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                          return `${years} 年`
                        })() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/companies/${companyId}/employees/${emp.id}/passport`}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          查看 →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
