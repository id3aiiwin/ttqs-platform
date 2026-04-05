'use client'

import { useState } from 'react'

interface Instructor {
  id: string
  full_name: string | null
  email: string
  role: string
  roles: string[]
  company_id: string | null
  instructor_level: string | null
  accumulated_hours: number
  average_satisfaction: number
}

interface Course {
  id: string
  title: string
  status: string
  start_date: string | null
  hours: number | null
  trainer: string | null
  company_id: string | null
  review_status: string
  is_counted_in_hours: boolean
  total_revenue: number
}

interface Props {
  instructors: Instructor[]
  courses: Course[]
  companyMap: Record<string, string>
}

const LEVEL_COLORS: Record<string, string> = {
  junior: 'bg-gray-100 text-gray-700',
  mid: 'bg-blue-100 text-blue-700',
  senior: 'bg-green-100 text-green-700',
  master: 'bg-purple-100 text-purple-700',
}

function levelLabel(level: string | null): string {
  if (!level) return '未設定'
  const map: Record<string, string> = { junior: '初級', mid: '中級', senior: '資深', master: '大師' }
  return map[level] ?? level
}

export function InstructorsClient({ instructors, courses, companyMap }: Props) {
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const levels = [...new Set(instructors.map(i => i.instructor_level).filter(Boolean))] as string[]

  const filtered = instructors.filter(i => {
    const matchSearch = !search || (i.full_name ?? i.email).toLowerCase().includes(search.toLowerCase())
    const matchLevel = !filterLevel || i.instructor_level === filterLevel
    return matchSearch && matchLevel
  })

  function getInstructorCourses(name: string | null) {
    if (!name) return []
    return courses.filter(c => c.trainer === name)
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="搜尋講師姓名..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
        />
        <select
          value={filterLevel}
          onChange={e => setFilterLevel(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">所有等級</option>
          {levels.map(l => (
            <option key={l} value={l}>{levelLabel(l)}</option>
          ))}
        </select>
        <span className="text-sm text-gray-400 self-center">共 {filtered.length} 位講師</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(instructor => {
          const ic = getInstructorCourses(instructor.full_name)
          const expanded = expandedId === instructor.id
          return (
            <div
              key={instructor.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpandedId(expanded ? null : instructor.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{instructor.full_name ?? instructor.email}</p>
                  <p className="text-xs text-gray-400">{instructor.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[instructor.instructor_level ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                  {levelLabel(instructor.instructor_level)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-indigo-600">{instructor.accumulated_hours}</p>
                  <p className="text-[10px] text-gray-400">累計時數</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-600">{instructor.average_satisfaction > 0 ? instructor.average_satisfaction.toFixed(1) : '—'}</p>
                  <p className="text-[10px] text-gray-400">滿意度</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-amber-600">{ic.length}</p>
                  <p className="text-[10px] text-gray-400">課程數</p>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">近期課程</p>
                  {ic.length === 0 ? (
                    <p className="text-xs text-gray-400">尚無課程紀錄</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {ic.slice(0, 10).map(c => (
                        <div key={c.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 truncate flex-1 mr-2">{c.title}</span>
                          <span className="text-gray-400 flex-shrink-0">
                            {c.start_date ?? '—'} · {c.hours ?? 0}h
                            {c.company_id && ` · ${companyMap[c.company_id] ?? ''}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">沒有符合條件的講師</div>
      )}
    </div>
  )
}
