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
  enrollments: Enrollment[]
}

export function StudentDashboard({ profile, enrollments }: Props) {
  const completed = enrollments.filter(e => e.status === 'completed').length
  const inProgress = enrollments.filter(e => e.status !== 'completed').length
  const totalHours = enrollments
    .filter(e => e.status === 'completed')
    .reduce((sum, e) => sum + (e.courses?.hours ?? 0), 0)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">歡迎，{profile.full_name ?? '學員'}！</h1>
        <p className="text-gray-500 mt-1">我的學習紀錄</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="已完成課程" value={completed} color="text-green-600" />
        <StatCard label="進行中" value={inProgress} color="text-yellow-600" />
        <StatCard label="總學習時數" value={totalHours} sub="小時" color="text-indigo-600" />
      </div>

      {/* 功能入口 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Link href="/shop" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors">
          <span className="text-2xl">🛒</span>
          <div>
            <p className="text-sm font-medium text-gray-900">課程商店</p>
            <p className="text-xs text-gray-400">瀏覽並購買課程</p>
          </div>
        </Link>
        <Link href="/my-orders" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors">
          <span className="text-2xl">📦</span>
          <div>
            <p className="text-sm font-medium text-gray-900">我的訂單</p>
            <p className="text-xs text-gray-400">查看購買紀錄</p>
          </div>
        </Link>
        <Link href="/my-talent" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors">
          <span className="text-2xl">🧠</span>
          <div>
            <p className="text-sm font-medium text-gray-900">天賦評量</p>
            <p className="text-xs text-gray-400">查看我的天賦報告</p>
          </div>
        </Link>
      </div>

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
                <Badge variant={e.status === 'completed' ? 'success' : 'warning'}>
                  {e.status === 'completed' ? '已完成' : '進行中'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
