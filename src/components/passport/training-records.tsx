import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Course {
  id: string
  title: string
  status: string
  start_date: string | null
  end_date: string | null
  hours: number | null
  trainer: string | null
  enrollment_status?: string
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
  enrolled: { label: '已報名', variant: 'default' },
  draft: { label: '草稿', variant: 'default' },
  planned: { label: '已規劃', variant: 'default' },
  in_progress: { label: '進行中', variant: 'warning' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'default' },
}

export function TrainingRecords({ courses }: { courses: Course[] }) {
  const totalHours = courses.reduce((sum, c) => sum + (c.hours ?? 0), 0)
  const thisYear = new Date().getFullYear().toString()
  const thisYearHours = courses
    .filter((c) => c.start_date?.startsWith(thisYear))
    .reduce((sum, c) => sum + (c.hours ?? 0), 0)
  const completedCount = courses.filter((c) => c.status === 'completed').length

  return (
    <>
      {/* 統計卡 */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <Card>
          <CardBody>
            <p className="text-xs text-gray-400">總課程數</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{courses.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-400">累計學時</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{totalHours}h</p>
            <p className="text-xs text-gray-400 mt-0.5">今年 {thisYearHours}h</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-400">已完成</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{completedCount}</p>
          </CardBody>
        </Card>
      </div>

      {/* 課程清單 */}
      <Card>
        <CardHeader><p className="font-semibold text-gray-900">參訓課程</p></CardHeader>
        {courses.length === 0 ? (
          <CardBody><p className="text-center text-sm text-gray-400 py-8">尚無訓練記錄</p></CardBody>
        ) : (
          <div className="divide-y divide-gray-100">
            {courses.map((course) => {
              const st = STATUS_MAP[course.status] ?? STATUS_MAP.draft
              return (
                <div key={course.id} className="px-6 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      {course.start_date && <span>{course.start_date}</span>}
                      {course.trainer && <span>講師：{course.trainer}</span>}
                    </div>
                  </div>
                  {course.hours && (
                    <span className="text-sm font-mono text-gray-500 flex-shrink-0">{course.hours}h</span>
                  )}
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}
