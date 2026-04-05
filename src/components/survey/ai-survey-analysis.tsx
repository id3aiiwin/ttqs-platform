'use client'

import { useState, useEffect } from 'react'

interface SectionStat {
  label: string
  avg: number
  items: { question: string; avg: number; count: number }[]
}

interface Stats {
  count: number
  overallAvg: number
  sections: Record<string, SectionStat>
  topFutureCourses: [string, number][]
}

interface Props {
  courseId: string
  courseTitle: string
  /** 是否為顧問（可填寫分析） */
  isConsultant?: boolean
}

export function AiSurveyAnalysis({ courseId, courseTitle, isConsultant }: Props) {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [analysisText, setAnalysisText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function fetchStats() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/survey-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setStats(data.stats)
        setAnalysisText(data.analysisText ?? '')
      }
    } catch {
      setError('載入失敗')
    }
    setLoading(false)
  }

  useEffect(() => { fetchStats() }, [courseId])

  async function handleSaveAnalysis() {
    setSaving(true)
    try {
      await fetch('/api/survey-stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, analysis_text: analysisText }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { alert('儲存失敗') }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">載入統計資料...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-500 text-center py-4">{error}</p>
  }

  if (!stats) return null

  function scoreColor(avg: number) {
    if (avg >= 4.5) return 'bg-green-500'
    if (avg >= 3.5) return 'bg-indigo-500'
    if (avg >= 2.5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  function scoreTextColor(avg: number) {
    if (avg >= 4.5) return 'text-green-700'
    if (avg >= 3.5) return 'text-indigo-700'
    if (avg >= 2.5) return 'text-yellow-700'
    return 'text-red-700'
  }

  return (
    <div className="space-y-6">
      {/* 統計摘要卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-indigo-50 rounded-lg p-3 text-center">
          <p className={`text-2xl font-bold ${scoreTextColor(stats.overallAvg)}`}>{stats.overallAvg}</p>
          <p className="text-xs text-indigo-500">綜合平均（{stats.count} 份）</p>
        </div>
        {Object.values(stats.sections).map(section => (
          <div key={section.label} className="bg-gray-50 rounded-lg p-3 text-center">
            <p className={`text-xl font-bold ${scoreTextColor(section.avg)}`}>{section.avg}</p>
            <p className="text-xs text-gray-500">{section.label}</p>
          </div>
        ))}
      </div>

      {/* 各面向明細 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.values(stats.sections).map(section => (
          <div key={section.label} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">{section.label}</p>
              <span className={`text-sm font-bold ${scoreTextColor(section.avg)}`}>{section.avg}</span>
            </div>
            <div className="space-y-2">
              {section.items.map(item => (
                <div key={item.question} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 truncate" title={item.question}>{item.question}</p>
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2 flex-shrink-0">
                    <div className={`h-2 rounded-full ${scoreColor(item.avg)}`} style={{ width: `${(item.avg / 5) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-7 text-right">{item.avg}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 未來期望課程 */}
      {stats.topFutureCourses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-900 mb-3">學員期望的未來課程</p>
          <div className="flex flex-wrap gap-2">
            {stats.topFutureCourses.map(([name, count]) => (
              <span key={name} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 rounded-full px-3 py-1">
                {name}
                <span className="bg-indigo-200 text-indigo-800 rounded-full px-1.5 py-0 text-[10px] font-bold">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 顧問分析填寫區 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="text-sm font-semibold text-gray-900">滿意度分析與建議</p>
          </div>
          {isConsultant && analysisText && (
            <div className="flex items-center gap-2">
              {saved && <span className="text-xs text-green-600">已儲存</span>}
              <button onClick={handleSaveAnalysis} disabled={saving}
                className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1 disabled:opacity-50">
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          )}
        </div>

        {isConsultant ? (
          <textarea
            value={analysisText}
            onChange={e => { setAnalysisText(e.target.value); setSaved(false) }}
            rows={8}
            placeholder="請根據上方統計數據，填寫您對此課程滿意度的分析與改善建議...&#10;&#10;建議包含：&#10;- 整體摘要&#10;- 亮點項目&#10;- 待改善項目&#10;- 具體改善建議"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          />
        ) : analysisText ? (
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{analysisText}</div>
        ) : (
          <p className="text-sm text-gray-400 italic">顧問尚未填寫分析</p>
        )}
      </div>
    </div>
  )
}
