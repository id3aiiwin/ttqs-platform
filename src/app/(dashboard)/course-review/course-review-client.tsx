'use client'

import Link from 'next/link'

interface Course {
  id: string
  title: string
  status: string
  start_date: string | null
  hours: number | null
  trainer: string | null
  company_id: string | null
  review_status: string
  created_at: string
}

interface Props {
  pending: Course[]
  recent: Course[]
  companyMap: Record<string, string>
}

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
}

const STATUS_LABELS: Record<string, string> = {
  approved: '已通過',
  rejected: '已駁回',
  pending: '待審核',
}

export function CourseReviewClient({ pending, recent, companyMap }: Props) {
  return (
    <div>
      {/* Pending Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          待審核
          {pending.length > 0 && <span className="ml-2 text-sm font-normal text-amber-600">({pending.length})</span>}
        </h2>

        {pending.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <p className="text-sm text-green-700">目前沒有待審核的課程</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(course => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{course.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {course.company_id ? companyMap[course.company_id] ?? '—' : '公開課'}
                    {course.trainer && ` · ${course.trainer}`}
                    {course.start_date && ` · ${course.start_date}`}
                    {course.hours != null && ` · ${course.hours}h`}
                  </p>
                </div>
                <Link
                  href={`/courses/${course.id}`}
                  className="ml-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex-shrink-0"
                >
                  審核
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Reviewed Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">已審核</h2>

        {recent.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400">尚無審核紀錄</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(course => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{course.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {course.company_id ? companyMap[course.company_id] ?? '—' : '公開課'}
                    {course.trainer && ` · ${course.trainer}`}
                    {course.start_date && ` · ${course.start_date}`}
                  </p>
                </div>
                <span className={`ml-4 text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_STYLES[course.review_status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_LABELS[course.review_status] ?? course.review_status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
