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

interface Enrollment {
  id: string
  status: string
  completed_at: string | null
  courses: { title: string; start_date: string | null; hours: number | null; trainer: string | null } | null
}

interface Props {
  profile: Profile
  companyName: string
  enrollments: Enrollment[]
}

export function EmployeeDashboard({ profile, companyName, enrollments }: Props) {
  const completed = enrollments.filter(e => e.status === 'completed').length
  const inProgress = enrollments.filter(e => e.status === 'enrolled' || e.status === 'in_progress').length
  const totalHours = enrollments
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + (e.courses?.hours ?? 0), 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">歡迎，{profile.full_name ?? '同仁'}！</h1>
        <p className="text-gray-500 mt-1">{companyName} — 我的學習紀錄</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="已完成課程" value={completed} color="text-green-600" />
        <StatCard label="進行中" value={inProgress} color="text-yellow-600" />
        <StatCard label="總學習時數" value={totalHours} sub="小時" color="text-indigo-600" />
      </div>

      {/* 學習護照入口 */}
      {profile.company_id && (
        <div className="mb-6">
          <Link
            href={`/companies/${profile.company_id}/employees/${profile.id}/passport`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            查看學習護照
          </Link>
        </div>
      )}

      {/* 課程紀錄 */}
      <Card>
        <CardHeader><p className="font-semibold text-gray-900">我的課程紀錄</p></CardHeader>
        <div className="divide-y divide-gray-100">
          {enrollments.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400">尚無課程紀錄</div>
          ) : (
            enrollments.map(e => (
              <div key={e.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.courses?.title ?? '未知課程'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {e.courses?.start_date && <span>{e.courses.start_date}</span>}
                    {e.courses?.hours && <span>{e.courses.hours} 小時</span>}
                    {e.courses?.trainer && <span>講師：{e.courses.trainer}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={e.status === 'completed' ? 'success' : 'warning'}>
                    {e.status === 'completed' ? '已完成' : '進行中'}
                  </Badge>
                  {e.completed_at && (
                    <p className="text-xs text-gray-400 mt-1">{new Date(e.completed_at).toLocaleDateString('zh-TW')}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
