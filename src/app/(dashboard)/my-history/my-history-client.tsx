'use client'

import { Card } from '@/components/ui/card'

type TimelineEvent = {
  id: string
  date: string
  type: 'course' | 'quiz' | 'purchase'
  title: string
  details: string
}

interface Props {
  events: TimelineEvent[]
  stats: {
    totalCourses: number
    totalHours: number
    totalQuizzes: number
    totalPurchases: number
  }
}

const TYPE_CONFIG = {
  course: { color: 'bg-blue-500', label: '課程', ringColor: 'ring-blue-100' },
  quiz: { color: 'bg-green-500', label: '測驗', ringColor: 'ring-green-100' },
  purchase: { color: 'bg-purple-500', label: '購買', ringColor: 'ring-purple-100' },
} as const

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function MyHistoryClient({ events, stats }: Props) {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '總課程數', value: stats.totalCourses, unit: '堂' },
          { label: '總時數', value: stats.totalHours, unit: 'h' },
          { label: '總測驗', value: stats.totalQuizzes, unit: '次' },
          { label: '總購買', value: stats.totalPurchases, unit: '項' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}<span className="text-sm font-normal text-gray-400 ml-1">{s.unit}</span></p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400 text-sm">尚無學習紀錄</p>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-100" />

            <div className="space-y-6">
              {events.map(event => {
                const cfg = TYPE_CONFIG[event.type]
                return (
                  <div key={event.id} className="relative flex gap-4">
                    {/* Dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className={`w-5 h-5 rounded-full ${cfg.color} ring-4 ${cfg.ringColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-400">{formatDate(event.date)}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          event.type === 'course' ? 'bg-blue-50 text-blue-600' :
                          event.type === 'quiz' ? 'bg-green-50 text-green-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{event.details}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
