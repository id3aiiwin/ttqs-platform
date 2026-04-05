'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CompanyData {
  id: string; name: string; status: string; industry: string | null
  totalRevenue: number; courseCount: number
  firstDealDate: string | null; lastCourseDate: string | null; lastContactDate: string | null
  activityLevel: 'active' | 'warning' | 'inactive'
  contractEnd: string | null
}

const ACTIVITY_LABELS: Record<string, { label: string; color: string; badge: 'success' | 'warning' | 'danger' }> = {
  active: { label: '活躍', color: 'text-green-600', badge: 'success' },
  warning: { label: '注意', color: 'text-amber-600', badge: 'warning' },
  inactive: { label: '需跟進', color: 'text-red-600', badge: 'danger' },
}

export function ClientAnalyticsClient({ companies }: { companies: CompanyData[] }) {
  const [sortBy, setSortBy] = useState<'revenue' | 'activity' | 'recent'>('revenue')
  const [filterActivity, setFilterActivity] = useState('')

  let filtered = filterActivity ? companies.filter(c => c.activityLevel === filterActivity) : companies

  if (sortBy === 'revenue') filtered = [...filtered].sort((a, b) => b.totalRevenue - a.totalRevenue)
  else if (sortBy === 'activity') filtered = [...filtered].sort((a, b) => {
    const order = { inactive: 0, warning: 1, active: 2 }
    return (order[a.activityLevel] ?? 0) - (order[b.activityLevel] ?? 0)
  })
  else filtered = [...filtered].sort((a, b) => (b.lastCourseDate ?? '').localeCompare(a.lastCourseDate ?? ''))

  const totalRevenue = companies.reduce((s, c) => s + c.totalRevenue, 0)
  const activeCount = companies.filter(c => c.activityLevel === 'active').length
  const warningCount = companies.filter(c => c.activityLevel === 'warning').length
  const inactiveCount = companies.filter(c => c.activityLevel === 'inactive').length

  // 合約即將到期（30天內）
  const today = new Date()
  const expiringSoon = companies.filter(c => {
    if (!c.contractEnd) return false
    const end = new Date(c.contractEnd)
    const days = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return days >= 0 && days <= 30
  })

  return (
    <div>
      {/* 統計 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">總營收</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">NT$ {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">活躍客戶</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
          <p className="text-xs text-gray-400">90 天內有互動</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">需注意</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{warningCount}</p>
          <p className="text-xs text-gray-400">90-180 天未互動</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">需跟進</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{inactiveCount}</p>
          <p className="text-xs text-gray-400">180 天以上未互動</p>
        </div>
      </div>

      {/* 合約到期提醒 */}
      {expiringSoon.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-700 mb-2">合約即將到期（30 天內）</p>
          <div className="flex flex-wrap gap-2">
            {expiringSoon.map(c => (
              <Link key={c.id} href={`/companies/${c.id}`}
                className="text-xs bg-white border border-red-200 rounded-lg px-3 py-1.5 text-red-700 hover:bg-red-100">
                {c.name} · {c.contractEnd}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 篩選 */}
      <div className="flex gap-2 mb-4">
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'revenue' | 'activity' | 'recent')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <option value="revenue">按營收排序</option>
          <option value="activity">按活躍度排序</option>
          <option value="recent">按最近開課</option>
        </select>
        <select value={filterActivity} onChange={e => setFilterActivity(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
          <option value="">全部活躍度</option>
          <option value="active">活躍</option>
          <option value="warning">注意</option>
          <option value="inactive">需跟進</option>
        </select>
      </div>

      {/* 客戶列表 */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">企業</th>
                <th className="px-4 py-3 text-left">活躍度</th>
                <th className="px-4 py-3 text-right">累計營收</th>
                <th className="px-4 py-3 text-right">課程數</th>
                <th className="px-4 py-3 text-left">最近開課</th>
                <th className="px-4 py-3 text-left">最近聯繫</th>
                <th className="px-4 py-3 text-left">合約到期</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => {
                const act = ACTIVITY_LABELS[c.activityLevel]
                const contractDays = c.contractEnd ? Math.ceil((new Date(c.contractEnd).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/companies/${c.id}`} className="font-medium text-gray-900 hover:text-indigo-600">{c.name}</Link>
                      {c.industry && <p className="text-xs text-gray-400">{c.industry}</p>}
                    </td>
                    <td className="px-4 py-3"><Badge variant={act.badge}>{act.label}</Badge></td>
                    <td className="px-4 py-3 text-right font-medium">NT$ {c.totalRevenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{c.courseCount}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.lastCourseDate ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.lastContactDate ?? '—'}</td>
                    <td className="px-4 py-3">
                      {c.contractEnd ? (
                        <span className={`text-xs ${contractDays !== null && contractDays <= 30 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {c.contractEnd}{contractDays !== null && contractDays <= 30 ? ` (${contractDays}天)` : ''}
                        </span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
