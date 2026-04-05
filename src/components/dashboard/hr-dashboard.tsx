import Link from 'next/link'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Profile, Company } from '@/types/database'

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
  company: Company | null
  employees: { id: string; full_name: string | null; email: string; role: string; department_id: string | null }[]
  courses: { id: string; title: string; status: string; start_date: string | null; hours: number | null }[]
  documents: { id: string; title: string; tier: number; status: string }[]
}

export function HrDashboard({ profile, company, employees, courses, documents }: Props) {
  if (!company) return <div className="p-8 text-gray-500">找不到企業資料</div>

  const totalEmp = employees.length
  const activeCourses = courses.filter(c => c.status === 'in_progress').length
  const completedCourses = courses.filter(c => c.status === 'completed').length
  const approvedDocs = documents.filter(d => d.status === 'approved').length

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">歡迎，{profile.full_name ?? 'HR'}！</h1>
        <p className="text-gray-500 mt-1">{company.name} — 人力資源管理</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="員工人數" value={totalEmp} color="text-gray-900" />
        <StatCard label="進行中課程" value={activeCourses} color="text-yellow-600" />
        <StatCard label="已完成課程" value={completedCourses} color="text-green-600" />
        <StatCard label="文件完成" value={approvedDocs} sub={`/ ${documents.length} 份`} color="text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近課程 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">最近課程</p>
              <Link href="/courses" className="text-xs text-indigo-600 hover:text-indigo-700">查看全部</Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {courses.slice(0, 5).map(c => (
              <div key={c.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.start_date ?? '未排期'}{c.hours ? ` · ${c.hours}h` : ''}</p>
                </div>
                <Badge variant={c.status === 'completed' ? 'success' : c.status === 'in_progress' ? 'warning' : 'default'}>
                  {c.status === 'completed' ? '已完成' : c.status === 'in_progress' ? '進行中' : '規劃中'}
                </Badge>
              </div>
            ))}
            {courses.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無課程</p>}
          </div>
        </Card>

        {/* 員工列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">員工列表</p>
              <span className="text-xs text-gray-400">{totalEmp} 人</span>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {employees.map(e => (
              <div key={e.id} className="px-6 py-2.5 flex items-center gap-3">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-indigo-700">{(e.full_name || e.email).charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{e.full_name || e.email}</p>
                </div>
                <span className="text-xs text-gray-400">{e.role === 'hr' ? 'HR' : e.role === 'manager' ? '主管' : '員工'}</span>
              </div>
            ))}
            {employees.length === 0 && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無員工</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
