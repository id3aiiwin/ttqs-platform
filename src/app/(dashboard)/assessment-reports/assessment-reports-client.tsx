'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Drive {
  name: string
  percentage: number
  pattern: string
}

interface Assessment {
  id: string
  profile_id: string
  drives: Drive[] | null
  assessment_date: string | null
  assessment_version: string | null
  created_at: string
  student_name: string
  company_id: string | null
  company_name: string
}

interface Props {
  assessments: Assessment[]
  companyOptions: { id: string; name: string }[]
}

const DRIVE_COLORS: Record<string, string> = {
  '行動力': 'bg-red-500',
  '學習力': 'bg-blue-500',
  '社交力': 'bg-yellow-500',
  '領導力': 'bg-purple-500',
  '執行力': 'bg-green-500',
  '創造力': 'bg-pink-500',
  '感受力': 'bg-cyan-500',
  '思維力': 'bg-indigo-500',
  '分析力': 'bg-orange-500',
  '自律力': 'bg-teal-500',
}

function patternPreview(drives: Drive[] | null): string {
  if (!drives || drives.length === 0) return '—'
  return drives.slice(0, 3).map(d => `${d.name}${d.pattern ?? ''}`).join(' / ')
}

export function AssessmentReportsClient({ assessments, companyOptions }: Props) {
  const [search, setSearch] = useState('')
  const [filterCompany, setFilterCompany] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = assessments.filter(a => {
    const matchSearch = !search || a.student_name.toLowerCase().includes(search.toLowerCase())
    const matchCompany = !filterCompany || a.company_id === filterCompany
    return matchSearch && matchCompany
  })

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">總報告數</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{assessments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">涵蓋企業</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{new Set(assessments.map(a => a.company_id).filter(Boolean)).size}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">篩選結果</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{filtered.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="搜尋學員姓名..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
        />
        <select
          value={filterCompany}
          onChange={e => setFilterCompany(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">所有企業</option>
          {companyOptions.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map(assessment => {
          const expanded = expandedId === assessment.id
          const drives = (assessment.drives ?? []) as Drive[]

          return (
            <div
              key={assessment.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpandedId(expanded ? null : assessment.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{assessment.student_name}</p>
                  <p className="text-xs text-gray-400">
                    {assessment.company_name} · {assessment.assessment_date ?? assessment.created_at?.split('T')[0] ?? '—'}
                    {assessment.assessment_version && ` · v${assessment.assessment_version}`}
                  </p>
                </div>
                <p className="text-xs text-gray-400">{patternPreview(drives)}</p>
              </div>

              {/* Expanded: all 10 drives */}
              {expanded && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-600 mb-3">十大驅力</p>
                  {drives.length === 0 ? (
                    <p className="text-xs text-gray-400">無驅力資料</p>
                  ) : (
                    <div className="space-y-2">
                      {drives.map((d, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-16 flex-shrink-0">{d.name}</span>
                          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${DRIVE_COLORS[d.name] ?? 'bg-gray-400'}`}
                              style={{ width: `${Math.min(d.percentage, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-12 text-right">{d.percentage.toFixed(1)}%</span>
                          <span className="text-xs text-gray-400 w-8">{d.pattern ?? ''}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/my-talent?profile=${assessment.profile_id}`}
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      查看完整報告 &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">沒有符合條件的評量報告</div>
      )}
    </div>
  )
}
