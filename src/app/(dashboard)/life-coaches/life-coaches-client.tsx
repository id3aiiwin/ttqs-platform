'use client'

import { useState } from 'react'

interface Analyst {
  id: string
  full_name: string | null
  email: string
  role: string
  roles: string[]
  company_id: string | null
  analyst_level: string | null
}

interface Case {
  id: string
  analyst_id: string
  case_title: string | null
  case_date: string | null
  case_type: string | null
  status: string
  client_name: string | null
}

interface Props {
  analysts: Analyst[]
  cases: Case[]
}

const LEVEL_COLORS: Record<string, string> = {
  trainee: 'bg-gray-100 text-gray-700',
  certified: 'bg-blue-100 text-blue-700',
  senior: 'bg-green-100 text-green-700',
  master: 'bg-purple-100 text-purple-700',
}

function levelLabel(level: string | null): string {
  if (!level) return '未設定'
  const map: Record<string, string> = { trainee: '實習', certified: '認證', senior: '資深', master: '大師' }
  return map[level] ?? level
}

export function LifeCoachesClient({ analysts, cases }: Props) {
  const [search, setSearch] = useState('')
  const [filterLevel, setFilterLevel] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const levels = [...new Set(analysts.map(a => a.analyst_level).filter(Boolean))] as string[]

  const filtered = analysts.filter(a => {
    const matchSearch = !search || (a.full_name ?? a.email).toLowerCase().includes(search.toLowerCase())
    const matchLevel = !filterLevel || a.analyst_level === filterLevel
    return matchSearch && matchLevel
  })

  function getAnalystCases(analystId: string) {
    return cases.filter(c => c.analyst_id === analystId)
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="搜尋教練姓名..."
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
        <span className="text-sm text-gray-400 self-center">共 {filtered.length} 位教練</span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(analyst => {
          const ac = getAnalystCases(analyst.id)
          const completedCount = ac.filter(c => c.status === 'completed').length
          const completionRate = ac.length > 0 ? Math.round((completedCount / ac.length) * 100) : 0
          const expanded = expandedId === analyst.id

          return (
            <div
              key={analyst.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpandedId(expanded ? null : analyst.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{analyst.full_name ?? analyst.email}</p>
                  <p className="text-xs text-gray-400">{analyst.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[analyst.analyst_level ?? ''] ?? 'bg-gray-100 text-gray-500'}`}>
                  {levelLabel(analyst.analyst_level)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-indigo-600">{ac.length}</p>
                  <p className="text-[10px] text-gray-400">個案數</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-600">{completedCount}</p>
                  <p className="text-[10px] text-gray-400">已完成</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-amber-600">{completionRate}%</p>
                  <p className="text-[10px] text-gray-400">完成率</p>
                </div>
              </div>

              {/* Expanded detail */}
              {expanded && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-2">個案紀錄</p>
                  {ac.length === 0 ? (
                    <p className="text-xs text-gray-400">尚無個案紀錄</p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {ac.slice(0, 10).map(c => (
                        <div key={c.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 truncate flex-1 mr-2">{c.case_title ?? c.client_name ?? '—'}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-gray-400">{c.case_date ?? '—'}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              c.status === 'completed' ? 'bg-green-100 text-green-700' :
                              c.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {c.status === 'completed' ? '完成' : c.status === 'in_progress' ? '進行中' : c.status}
                            </span>
                          </div>
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
        <div className="text-center py-12 text-gray-400 text-sm">沒有符合條件的生命教練</div>
      )}
    </div>
  )
}
