'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PrintReportButton } from '@/components/ui/print-report'

interface RecentCourse {
  id: string
  title: string
  startDate: string | null
  companyName: string
  hours: number
  status: string
  courseType: string | null
}

interface InstructorData {
  id: string
  name: string
  level: string
  totalCourses: number
  totalHours: number
  monthHours: number
  averageSatisfaction: number
  totalRevenue: number
  materialPunctuality: number
  recentTrend: number
  pendingReview: number
  recentCourses: RecentCourse[]
}

interface Summary {
  totalInstructors: number
  totalMonthHours: number
  avgSatisfaction: number
  totalPendingReview: number
}

type SortKey = 'hours' | 'satisfaction' | 'revenue' | 'punctuality'

const LEVEL_CONFIG: Record<string, { label: string; variant: 'default' | 'info' | 'purple' | 'success' | 'warning' | 'danger' }> = {
  L1: { label: '助理講師', variant: 'default' },
  L2: { label: '講師', variant: 'info' },
  L3: { label: '資深講師', variant: 'purple' },
  L4: { label: '首席講師', variant: 'purple' },
}

function getLevelBadge(level: string) {
  const config = LEVEL_CONFIG[level] ?? { label: level, variant: 'default' as const }
  // L3 uses indigo (custom), L4 uses purple variant
  if (level === 'L3') {
    return <Badge className="bg-indigo-100 text-indigo-700">{config.label}</Badge>
  }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function InstructorAnalyticsClient({ instructors, summary }: { instructors: InstructorData[]; summary: Summary }) {
  const [sortBy, setSortBy] = useState<SortKey>('hours')
  const [filterLevel, setFilterLevel] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  let filtered = filterLevel ? instructors.filter(i => i.level === filterLevel) : instructors

  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'hours': return b.totalHours - a.totalHours
      case 'satisfaction': return b.averageSatisfaction - a.averageSatisfaction
      case 'revenue': return b.totalRevenue - a.totalRevenue
      case 'punctuality': return b.materialPunctuality - a.materialPunctuality
      default: return 0
    }
  })

  return (
    <div>
      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">總講師數</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{summary.totalInstructors}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">本月授課時數</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary.totalMonthHours}</p>
          <p className="text-xs text-gray-400">小時</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">平均滿意度</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{summary.avgSatisfaction.toFixed(2)}</p>
          <p className="text-xs text-gray-400">滿分 5.0</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">待審核課程</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{summary.totalPendingReview}</p>
        </div>
      </div>

      {/* 篩選 */}
      <div className="flex gap-2 mb-4">
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <option value="hours">按時數排序</option>
          <option value="satisfaction">按滿意度排序</option>
          <option value="revenue">按營收排序</option>
          <option value="punctuality">按準時率排序</option>
        </select>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <option value="">全部等級</option>
          <option value="L1">L1 助理講師</option>
          <option value="L2">L2 講師</option>
          <option value="L3">L3 資深講師</option>
          <option value="L4">L4 首席講師</option>
        </select>
        <div className="flex-1" />
        <PrintReportButton
          title="講師績效分析報告"
          subtitle="Instructor Analytics Report"
          getContent={() => {
            const levelLabels: Record<string, string> = { L1: '助理講師', L2: '講師', L3: '資深講師', L4: '首席講師' }
            const rows = sorted.map(inst =>
              `<tr>
                <td>${inst.name}</td>
                <td>${levelLabels[inst.level] ?? inst.level}</td>
                <td style="text-align:right">${inst.totalHours}</td>
                <td style="text-align:right">${inst.averageSatisfaction > 0 ? inst.averageSatisfaction.toFixed(2) : '—'}</td>
                <td style="text-align:right">${inst.totalCourses}</td>
                <td style="text-align:right">NT$ ${inst.totalRevenue.toLocaleString()}</td>
                <td style="text-align:right">${inst.materialPunctuality}%</td>
              </tr>`
            ).join('')

            return `
              <div class="stat-grid">
                <div class="stat-card"><div class="value">${summary.totalInstructors}</div><div class="label">總講師數</div></div>
                <div class="stat-card"><div class="value" style="color:#2563eb">${summary.totalMonthHours}</div><div class="label">本月授課時數</div></div>
                <div class="stat-card"><div class="value" style="color:#16a34a">${summary.avgSatisfaction.toFixed(2)}</div><div class="label">平均滿意度</div></div>
                <div class="stat-card"><div class="value" style="color:#d97706">${summary.totalPendingReview}</div><div class="label">待審核課程</div></div>
              </div>

              <div class="section">
                <h2>講師明細</h2>
                <table>
                  <thead><tr><th>講師</th><th>等級</th><th style="text-align:right">累計時數</th><th style="text-align:right">滿意度</th><th style="text-align:right">課程數</th><th style="text-align:right">營收貢獻</th><th style="text-align:right">教材準時率</th></tr></thead>
                  <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#9ca3af">無講師資料</td></tr>'}</tbody>
                </table>
              </div>
            `
          }}
        />
      </div>

      {/* 講師列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">講師</th>
                <th className="px-4 py-3 text-left">等級</th>
                <th className="px-4 py-3 text-right">累計時數</th>
                <th className="px-4 py-3 text-right">本月時數</th>
                <th className="px-4 py-3 text-right">滿意度</th>
                <th className="px-4 py-3 text-right">課程數</th>
                <th className="px-4 py-3 text-right">營收貢獻</th>
                <th className="px-4 py-3 text-right">教材準時率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(inst => {
                const isExpanded = expandedId === inst.id
                return (
                  <tr key={inst.id} className="group">
                    <td colSpan={8} className="p-0">
                      <div
                        className="grid grid-cols-8 items-center cursor-pointer hover:bg-gray-50 px-4 py-3"
                        onClick={() => setExpandedId(isExpanded ? null : inst.id)}
                      >
                        <div className="col-span-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>&#9654;</span>
                            <div>
                              <p className="font-medium text-gray-900">{inst.name}</p>
                              {inst.recentTrend !== 0 && (
                                <p className={`text-xs ${inst.recentTrend > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                  {inst.recentTrend > 0 ? '+' : ''}{inst.recentTrend}% 趨勢
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-1">{getLevelBadge(inst.level)}</div>
                        <div className="col-span-1 text-right font-medium">{inst.totalHours}</div>
                        <div className="col-span-1 text-right">{inst.monthHours}</div>
                        <div className="col-span-1 text-right">
                          <span className={inst.averageSatisfaction >= 4.5 ? 'text-green-600 font-medium' : inst.averageSatisfaction >= 3.5 ? 'text-gray-900' : 'text-red-500'}>
                            {inst.averageSatisfaction > 0 ? inst.averageSatisfaction.toFixed(2) : '—'}
                          </span>
                        </div>
                        <div className="col-span-1 text-right">{inst.totalCourses}</div>
                        <div className="col-span-1 text-right font-medium">NT$ {inst.totalRevenue.toLocaleString()}</div>
                        <div className="col-span-1 text-right">
                          <span className={inst.materialPunctuality >= 80 ? 'text-green-600' : inst.materialPunctuality >= 50 ? 'text-amber-600' : 'text-red-500'}>
                            {inst.materialPunctuality}%
                          </span>
                        </div>
                      </div>

                      {/* 展開：近期課程 */}
                      {isExpanded && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-3">近期課程</p>
                          {inst.recentCourses.length === 0 ? (
                            <p className="text-xs text-gray-400">暫無課程紀錄</p>
                          ) : (
                            <div className="grid gap-2">
                              {inst.recentCourses.map(c => (
                                <div key={c.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-2 text-xs">
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-400 w-20">{c.startDate ?? '—'}</span>
                                    <span className="font-medium text-gray-900">{c.title}</span>
                                    <span className="text-gray-400">{c.companyName}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {c.courseType && (
                                      <Badge variant={c.courseType === 'enterprise' ? 'info' : 'default'}>
                                        {c.courseType === 'enterprise' ? '企業' : c.courseType === 'public' ? '公開班' : c.courseType}
                                      </Badge>
                                    )}
                                    <span className="text-gray-500">{c.hours}h</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                    無講師資料
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
