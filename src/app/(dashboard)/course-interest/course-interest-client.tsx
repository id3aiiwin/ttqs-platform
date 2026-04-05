'use client'

import { useState } from 'react'

interface RankingItem { name: string; count: number }

interface Props {
  overallRanking: RankingItem[]
  perCompanyData: Record<string, { name: string; ranking: RankingItem[] }>
  companyOptions: { id: string; name: string }[]
  trendData: Record<string, string | number>[]
  top5: string[]
  monthKeys: string[]
  totalResponses: number
  thisMonthResponses: number
  companyCount: number
}

const TREND_COLORS = [
  { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-100' },
  { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-100' },
  { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-100' },
  { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-100' },
  { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-100' },
]

export function CourseInterestClient({
  overallRanking,
  perCompanyData,
  companyOptions,
  trendData,
  top5,
  monthKeys,
  totalResponses,
  thisMonthResponses,
  companyCount,
}: Props) {
  const [selectedCompany, setSelectedCompany] = useState('')

  const topCourse = overallRanking[0]
  const secondCourse = overallRanking[1]

  // Compute max value across all trend data for scaling
  const trendMax = Math.max(1, ...trendData.flatMap(d => top5.map(name => (d[name] as number) ?? 0)))

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">總回覆數</p>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{totalResponses}</p>
          <p className="text-xs text-gray-400">含未來課程選擇</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">最熱門課程</p>
          <p className="text-lg font-bold text-indigo-600 mt-1 truncate">{topCourse?.name ?? '-'}</p>
          <p className="text-xs text-gray-400">{topCourse?.count ?? 0} 人次選擇</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">涵蓋企業數</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{companyCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">本月回覆</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{thisMonthResponses}</p>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-indigo-700 mb-1">分析洞察</p>
        <p className="text-sm text-indigo-600">
          {topCourse && topCourse.count > 0
            ? <>最多學員想學的是「{topCourse.name}」（{topCourse.count} 人次）
              {secondCourse && secondCourse.count > 0 && <>，其次是「{secondCourse.name}」（{secondCourse.count} 人次）</>}。
              共有 {totalResponses} 份回覆表達了未來課程期待，涵蓋 {companyCount} 家企業。</>
            : '目前尚無學員填寫未來期待課程。'}
        </p>
      </div>

      {/* Overall Ranking */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">整體課程興趣排名</h2>
        <RankingBars ranking={overallRanking} color="bg-indigo-500" />
      </div>

      {/* Per-Company Rankings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">各企業課程興趣排名</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {companyOptions
            .filter(c => perCompanyData[c.id] && perCompanyData[c.id].ranking.some(r => r.count > 0))
            .map(c => {
              const data = perCompanyData[c.id]
              const top3 = data.ranking.filter(r => r.count > 0).slice(0, 5)
              const totalVotes = data.ranking.reduce((s, r) => s + r.count, 0)
              return (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">{c.name}</h3>
                    <span className="text-xs text-gray-400">{totalVotes} 人次</span>
                  </div>
                  <RankingBars ranking={top3} color="bg-emerald-500" compact />
                  {data.ranking.filter(r => r.count > 0).length > 5 && (
                    <button onClick={() => setSelectedCompany(selectedCompany === c.id ? '' : c.id)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 mt-2">
                      {selectedCompany === c.id ? '收合' : `查看全部 ${data.ranking.filter(r => r.count > 0).length} 項 →`}
                    </button>
                  )}
                  {selectedCompany === c.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <RankingBars ranking={data.ranking.filter(r => r.count > 0)} color="bg-emerald-500" />
                    </div>
                  )}
                </div>
              )
            })}
        </div>
        {companyOptions.filter(c => perCompanyData[c.id]?.ranking.some(r => r.count > 0)).length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
            尚無企業的課程興趣資料
          </div>
        )}
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">月度趨勢（Top 5）</h2>
        <p className="text-xs text-gray-400 mb-4">最近 12 個月，前 5 名課程興趣的變化</p>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4">
          {top5.map((name, i) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${TREND_COLORS[i]!.bg}`} />
              <span className="text-xs text-gray-600">{name}</span>
            </div>
          ))}
        </div>

        {/* Bar chart - grouped by month */}
        <div className="overflow-x-auto">
          <div className="flex items-end gap-1 min-w-[600px]" style={{ height: 200 }}>
            {trendData.map((d, mIdx) => (
              <div key={mIdx} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="flex items-end gap-px w-full justify-center" style={{ height: 170 }}>
                  {top5.map((name, i) => {
                    const val = (d[name] as number) ?? 0
                    const h = trendMax > 0 ? (val / trendMax) * 160 : 0
                    return (
                      <div
                        key={name}
                        className={`${TREND_COLORS[i]!.bg} rounded-t-sm flex-1 max-w-[10px] transition-all relative group`}
                        style={{ height: Math.max(h, val > 0 ? 4 : 0) }}
                        title={`${name}: ${val}`}
                      >
                        {val > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                            {val}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <span className="text-[10px] text-gray-400 mt-1">
                  {(d.month as string).slice(5)}月
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RankingBars({ ranking, color, compact }: { ranking: RankingItem[]; color: string; compact?: boolean }) {
  const max = ranking[0]?.count ?? 1
  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {ranking.map((item, idx) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className={`text-xs text-gray-400 ${compact ? 'w-4' : 'w-5'} text-right flex-shrink-0`}>{idx + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className={`${compact ? 'text-xs' : 'text-sm'} text-gray-700 truncate`}>{item.name}</span>
              <span className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 ml-2 flex-shrink-0`}>{item.count}</span>
            </div>
            <div className={`w-full bg-gray-100 rounded-full ${compact ? 'h-1.5' : 'h-2'}`}>
              <div
                className={`${color} ${compact ? 'h-1.5' : 'h-2'} rounded-full transition-all`}
                style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
