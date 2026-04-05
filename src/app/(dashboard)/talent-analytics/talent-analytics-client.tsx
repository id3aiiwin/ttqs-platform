'use client'

import { useState } from 'react'
import { PrintReportButton } from '@/components/ui/print-report'

interface Props {
  totalAssessments: number
  thisMonthCount: number
  analystCount: number
  companyCount: number
  monthlyTrend: { month: string; count: number }[]
  patternDistribution: { name: string; count: number }[]
  driveAverages: { name: string; average: number }[]
  companyStats: { companyId: string; companyName: string; count: number; lastDate: string | null }[]
  analystStats: { analystId: string; name: string; total: number; completed: number; completionRate: number }[]
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

export function TalentAnalyticsClient({
  totalAssessments,
  thisMonthCount,
  analystCount,
  companyCount,
  monthlyTrend,
  patternDistribution,
  driveAverages,
  companyStats,
  analystStats,
}: Props) {
  const [tab, setTab] = useState<'overview' | 'companies' | 'analysts'>('overview')

  const maxPatternCount = Math.max(...patternDistribution.map(p => p.count), 1)
  const maxMonthCount = Math.max(...monthlyTrend.map(m => m.count), 1)

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">總評量數</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalAssessments}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">本月評量</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{thisMonthCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">分析師數</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{analystCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">涵蓋企業數</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{companyCount}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'overview' as const, label: '總覽' },
          { key: 'companies' as const, label: '企業統計' },
          { key: 'analysts' as const, label: '分析師排行' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
              tab === t.key
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        <PrintReportButton
          title="天賦分析報告"
          subtitle="Talent Analytics Report"
          getContent={() => {
            const patternRows = patternDistribution.map(p =>
              `<tr><td>${p.name}</td><td style="text-align:right">${p.count}</td></tr>`
            ).join('')

            const driveRows = driveAverages.map(d =>
              `<tr><td>${d.name}</td><td style="text-align:right">${d.average}%</td></tr>`
            ).join('')

            return `
              <div class="stat-grid">
                <div class="stat-card"><div class="value">${totalAssessments}</div><div class="label">總評量數</div></div>
                <div class="stat-card"><div class="value" style="color:#16a34a">${thisMonthCount}</div><div class="label">本月評量</div></div>
                <div class="stat-card"><div class="value" style="color:#9333ea">${analystCount}</div><div class="label">分析師數</div></div>
                <div class="stat-card"><div class="value" style="color:#d97706">${companyCount}</div><div class="label">涵蓋企業數</div></div>
              </div>

              <div class="section">
                <h2>天賦圖型分布</h2>
                <table>
                  <thead><tr><th>圖型</th><th style="text-align:right">數量</th></tr></thead>
                  <tbody>${patternRows || '<tr><td colspan="2" style="text-align:center;color:#9ca3af">尚無資料</td></tr>'}</tbody>
                </table>
              </div>

              <div class="section">
                <h2>十大驅力平均強度</h2>
                <table>
                  <thead><tr><th>驅力</th><th style="text-align:right">平均強度</th></tr></thead>
                  <tbody>${driveRows || '<tr><td colspan="2" style="text-align:center;color:#9ca3af">尚無資料</td></tr>'}</tbody>
                </table>
              </div>
            `
          }}
        />
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Monthly Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">月度評量趨勢（近 12 個月）</h2>
            <div className="flex items-end gap-2 h-40">
              {monthlyTrend.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500">{m.count || ''}</span>
                  <div
                    className="w-full bg-indigo-500 rounded-t transition-all"
                    style={{ height: `${maxMonthCount > 0 ? (m.count / maxMonthCount) * 120 : 0}px`, minHeight: m.count > 0 ? '4px' : '0px' }}
                  />
                  <span className="text-xs text-gray-400 mt-1">{m.month}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pattern Distribution */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">天賦圖型分布</h2>
              {patternDistribution.length === 0 ? (
                <p className="text-sm text-gray-400">尚無評量資料</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {patternDistribution.map(p => (
                    <div key={p.name} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-16 shrink-0 text-right">{p.name}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${(p.count / maxPatternCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{p.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drive Averages */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">十大驅力平均強度</h2>
              <div className="space-y-3">
                {driveAverages.map(d => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-12 shrink-0 text-right">{d.name}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`${DRIVE_COLORS[d.name] ?? 'bg-gray-500'} h-full rounded-full transition-all`}
                        style={{ width: `${d.average}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">{d.average}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'companies' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">企業</th>
                  <th className="px-4 py-3 text-right">評量數</th>
                  <th className="px-4 py-3 text-left">最近評量日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companyStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">尚無企業評量資料</td>
                  </tr>
                ) : (
                  companyStats.map(c => (
                    <tr key={c.companyId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{c.companyName}</td>
                      <td className="px-4 py-3 text-right">{c.count}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.lastDate ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'analysts' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">分析師</th>
                  <th className="px-4 py-3 text-right">個案數</th>
                  <th className="px-4 py-3 text-right">完成率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {analystStats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-gray-400 text-sm">尚無分析師資料</td>
                  </tr>
                ) : (
                  analystStats.map(a => (
                    <tr key={a.analystId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                      <td className="px-4 py-3 text-right">{a.total}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                          a.completionRate >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {a.completionRate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
