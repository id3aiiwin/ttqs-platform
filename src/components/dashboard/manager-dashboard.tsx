import Link from 'next/link'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Profile } from '@/types/database'

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <Card><CardBody>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </CardBody></Card>
  )
}

interface Props {
  profile: Profile
  companyName: string
  employees: { id: string; full_name: string | null; email: string; role: string }[]
  courses: { id: string; title: string; status: string; start_date: string | null }[]
  enrollments: { id: string; course_id: string; employee_id: string; status: string; completed_at: string | null }[]
}

export function ManagerDashboard({ profile, companyName, employees, courses, enrollments }: Props) {
  const totalEmp = employees.length
  const completedEnrollments = enrollments.filter(e => e.status === 'completed').length
  const totalEnrollments = enrollments.length

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">歡迎，{profile.full_name ?? '主管'}！</h1>
        <p className="text-gray-500 mt-1">{companyName} — 部門訓練管理</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="部門人數" value={totalEmp} color="text-gray-900" />
        <StatCard label="訓練完成" value={completedEnrollments} sub={`/ ${totalEnrollments} 筆`} color="text-green-600" />
        <StatCard label="近期課程" value={courses.length} color="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 部門成員 */}
        <Card>
          <CardHeader><p className="font-semibold text-gray-900">部門成員</p></CardHeader>
          <div className="divide-y divide-gray-100">
            {employees.map(e => {
              const empEnrollments = enrollments.filter(en => en.employee_id === e.id)
              const empCompleted = empEnrollments.filter(en => en.status === 'completed').length
              return (
                <div key={e.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-indigo-700">{(e.full_name || e.email).charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.full_name || e.email}</p>
                    <p className="text-xs text-gray-400">訓練完成 {empCompleted}/{empEnrollments.length}</p>
                  </div>
                </div>
              )
            })}
            {employees.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無部門成員</p>}
          </div>
        </Card>

        {/* 近期課程 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">近期課程</p>
              <Link href="/courses" className="text-xs text-indigo-600 hover:text-indigo-700">查看全部</Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {courses.map(c => (
              <div key={c.id} className="px-6 py-3">
                <p className="text-sm font-medium text-gray-900">{c.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={c.status === 'completed' ? 'success' : c.status === 'in_progress' ? 'warning' : 'default'}>
                    {c.status === 'completed' ? '已完成' : c.status === 'in_progress' ? '進行中' : '規劃中'}
                  </Badge>
                  {c.start_date && <span className="text-xs text-gray-400">{c.start_date}</span>}
                </div>
              </div>
            ))}
            {courses.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無課程</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
