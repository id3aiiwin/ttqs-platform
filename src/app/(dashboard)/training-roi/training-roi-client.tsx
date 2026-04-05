'use client'

import { useState } from 'react'
import { PrintReportButton } from '@/components/ui/print-report'

interface CompanyRoi {
  id: string
  name: string
  industry: string | null
  totalInvestment: number
  totalRevenue: number
  courseCount: number
  trainingHours: number
  avgSatisfaction: number | null
  employeeCount: number | null
  roi: number
}

interface MonthlyTrend {
  month: string
  enterprise: number
  public_: number
  product: number
}

interface Props {
  companyRoi: CompanyRoi[]
  monthlyTrend: MonthlyTrend[]
  summary: {
    totalRevenue: number
    totalInvestment: number
    roi: number
    totalHours: number
  }
  revenueBreakdown: {
    enterprise: number
    public_: number
    product: number
  }
  currentYear: number
}

type SortKey = 'roi' | 'revenue' | 'investment'

export function TrainingRoiClient({ companyRoi, monthlyTrend, summary, revenueBreakdown, currentYear }: Props) {
  const [year, setYear] = useState(currentYear)
  const [sortBy, setSortBy] = useState<SortKey>('roi')

  // Sort companies
  const sorted = [...companyRoi].sort((a, b) => {
    if (sortBy === 'roi') return b.roi - a.roi
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue
    return b.totalInvestment - a.totalInvestment
  })

  // Revenue breakdown percentages
  const breakdownTotal = revenueBreakdown.enterprise + revenueBreakdown.public_ + revenueBreakdown.product
  const pctEnterprise = breakdownTotal > 0 ? Math.round(revenueBreakdown.enterprise / breakdownTotal * 100) : 0
  const pctPublic = breakdownTotal > 0 ? Math.round(revenueBreakdown.public_ / breakdownTotal * 100) : 0
  const pctProduct = breakdownTotal > 0 ? 100 - pctEnterprise - pctPublic : 0

  // Bar chart max
  const barMax = Math.max(...monthlyTrend.map(m => m.enterprise + m.public_ + m.product), 1)

  return (
    <div>
      {/* 年份切換 + 匯出 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
          >
            <option value={currentYear}>{currentYear} 年度</option>
            <option value={currentYear - 1}>{currentYear - 1} 年度</option>
          </select>
        </div>
        <PrintReportButton
          title={`${year} 年度訓練投資報酬率報告`}
          subtitle="Training ROI Analysis"
          getContent={() => {
            const roiRows = sorted.map(c =>
              `<tr>
                <td>${c.name}${c.industry ? ` <span style="color:#9ca3af;font-size:10px">${c.industry}</span>` : ''}</td>
                <td style="text-align:right">NT$ ${c.totalInvestment.toLocaleString()}</td>
                <td style="text-align:right">NT$ ${c.totalRevenue.toLocaleString()}</td>
                <td style="text-align:right">${c.courseCount}</td>
                <td style="text-align:right">${c.trainingHours}</td>
                <td style="text-align:right;color:${c.roi >= 50 ? '#15803d' : c.roi >= 0 ? '#b45309' : '#dc2626'};font-weight:600">${c.roi}%</td>
              </tr>`
            ).join('')

            return `
              <div class="stat-grid">
                <div class="stat-card"><div class="value">NT$ ${summary.totalRevenue.toLocaleString()}</div><div class="label">年度總營收</div></div>
                <div class="stat-card"><div class="value" style="color:#d97706">NT$ ${summary.totalInvestment.toLocaleString()}</div><div class="label">年度總投入</div></div>
                <div class="stat-card"><div class="value" style="color:${summary.roi >= 0 ? '#16a34a' : '#dc2626'}">${summary.roi}%</div><div class="label">ROI</div></div>
                <div class="stat-card"><div class="value" style="color:#2563eb">${summary.totalHours.toLocaleString()} hr</div><div class="label">訓練總時數</div></div>
              </div>

              <div class="section">
                <h2>營收結構</h2>
                <table>
                  <thead><tr><th>類型</th><th style="text-align:right">金額</th><th style="text-align:right">佔比</th></tr></thead>
                  <tbody>
                    <tr><td>企業內訓</td><td style="text-align:right">NT$ ${revenueBreakdown.enterprise.toLocaleString()}</td><td style="text-align:right">${pctEnterprise}%</td></tr>
                    <tr><td>公開課</td><td style="text-align:right">NT$ ${revenueBreakdown.public_.toLocaleString()}</td><td style="text-align:right">${pctPublic}%</td></tr>
                    <tr><td>產品銷售</td><td style="text-align:right">NT$ ${revenueBreakdown.product.toLocaleString()}</td><td style="text-align:right">${pctProduct}%</td></tr>
                  </tbody>
                </table>
              </div>

              <div class="section">
                <h2>企業 ROI 排行</h2>
                <table>
                  <thead><tr><th>企業</th><th style="text-align:right">投入預算</th><th style="text-align:right">課程營收</th><th style="text-align:right">課程數</th><th style="text-align:right">時數</th><th style="text-align:right">ROI%</th></tr></thead>
                  <tbody>${roiRows || '<tr><td colspan="6" style="text-align:center;color:#9ca3af">尚無數據</td></tr>'}</tbody>
                </table>
              </div>
            `
          }}
        />
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">年度總營收</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">NT$ {summary.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">年度總投入</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">NT$ {summary.totalInvestment.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">ROI</p>
          <p className={`text-2xl font-bold mt-1 ${summary.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.roi}%
          </p>
          <p className="text-xs text-gray-400">(營收-投入)/投入</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">訓練總時數</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{summary.totalHours.toLocaleString()} hr</p>
        </div>
      </div>

      {/* 月營收趨勢 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">月營收趨勢（近 12 個月）</h2>
        <div className="flex items-end gap-1.5 h-48">
          {monthlyTrend.map(m => {
            const total = m.enterprise + m.public_ + m.product
            const heightPct = barMax > 0 ? (total / barMax) * 100 : 0
            const entPct = total > 0 ? (m.enterprise / total) * 100 : 0
            const pubPct = total > 0 ? (m.public_ / total) * 100 : 0
            const prodPct = total > 0 ? (m.product / total) * 100 : 0
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-10">
                  <p className="font-medium mb-1">{m.month}</p>
                  <p>企業內訓: NT$ {m.enterprise.toLocaleString()}</p>
                  <p>公開課: NT$ {m.public_.toLocaleString()}</p>
                  <p>產品: NT$ {m.product.toLocaleString()}</p>
                  <p className="font-medium mt-1 border-t border-gray-600 pt-1">合計: NT$ {total.toLocaleString()}</p>
                </div>
                {/* Bar */}
                <div
                  className="w-full rounded-t-sm overflow-hidden flex flex-col-reverse"
                  style={{ height: `${Math.max(heightPct, 2)}%` }}
                >
                  {m.product > 0 && (
                    <div className="bg-purple-400" style={{ height: `${prodPct}%` }} />
                  )}
                  {m.public_ > 0 && (
                    <div className="bg-sky-400" style={{ height: `${pubPct}%` }} />
                  )}
                  {m.enterprise > 0 && (
                    <div className="bg-indigo-500" style={{ height: `${entPct}%` }} />
                  )}
                  {total === 0 && <div className="bg-gray-100 h-full" />}
                </div>
                <p className="text-[10px] text-gray-400 mt-1 truncate w-full text-center">{m.month.slice(5)}</p>
              </div>
            )
          })}
        </div>
        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" /> 企業內訓</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-sky-400 inline-block" /> 公開課</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-400 inline-block" /> 產品銷售</span>
        </div>
      </div>

      {/* 營收結構 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">營收結構</h2>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">企業內訓</span>
              <span className="text-gray-900 font-medium">NT$ {revenueBreakdown.enterprise.toLocaleString()} ({pctEnterprise}%)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pctEnterprise}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">公開課</span>
              <span className="text-gray-900 font-medium">NT$ {revenueBreakdown.public_.toLocaleString()} ({pctPublic}%)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-sky-400 rounded-full transition-all" style={{ width: `${pctPublic}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">產品銷售</span>
              <span className="text-gray-900 font-medium">NT$ {revenueBreakdown.product.toLocaleString()} ({pctProduct}%)</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full transition-all" style={{ width: `${pctProduct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 企業 ROI 排行 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">企業 ROI 排行</h2>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
          >
            <option value="roi">依 ROI 排序</option>
            <option value="revenue">依營收排序</option>
            <option value="investment">依投入排序</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">企業</th>
                <th className="px-4 py-3 text-right">投入預算</th>
                <th className="px-4 py-3 text-right">課程營收</th>
                <th className="px-4 py-3 text-right">課程數</th>
                <th className="px-4 py-3 text-right">時數</th>
                <th className="px-4 py-3 text-right">ROI%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">尚無數據</td>
                </tr>
              )}
              {sorted.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{c.name}</span>
                    {c.industry && <p className="text-xs text-gray-400">{c.industry}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">NT$ {c.totalInvestment.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">NT$ {c.totalRevenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{c.courseCount}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{c.trainingHours}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                      c.roi >= 50 ? 'bg-green-50 text-green-700' :
                      c.roi >= 0 ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {c.roi}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
