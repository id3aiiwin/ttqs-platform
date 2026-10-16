'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const CATEGORIES = [
  { value: '', label: '全部類別' },
  { value: 'ttqs', label: 'TTQS 文件範本' },
  { value: 'course_material', label: '課程教材' },
  { value: 'reference', label: '參考資料' },
]

const PHASES = [
  { value: '', label: '全部構面' },
  { value: 'P', label: 'Plan 計畫' },
  { value: 'D', label: 'Design 設計' },
  { value: 'DO', label: 'Do 執行' },
  { value: 'R', label: 'Review 查核' },
  { value: 'O', label: 'Outcome 成果' },
  { value: 'general', label: '通用' },
]

const TIERS = [
  { value: '', label: '全部階層' },
  { value: '1', label: '一階文件' },
  { value: '2', label: '二階文件' },
  { value: '3', label: '三階文件' },
  { value: '4', label: '四階文件' },
]

export function KbFilter({ currentCategory, currentPhase, currentTier, currentSearch }: {
  currentCategory: string; currentPhase: string; currentTier: string; currentSearch: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)

  function navigate(category: string, phase: string, tier: string, s?: string) {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (phase) params.set('phase', phase)
    if (tier) params.set('tier', tier)
    if (s) params.set('search', s)
    router.push(`/knowledge-base${params.toString() ? '?' + params.toString() : ''}`)
  }

  const isCourseOrRef = currentCategory === 'course_material' || currentCategory === 'reference'

  return (
    <div className="flex flex-col gap-4">
      {/* 搜尋 */}
      <div>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(currentCategory, currentPhase, currentTier, search)}
          placeholder="搜尋知識庫..."
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
      </div>

      {/* 類別 */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">內容類別</p>
        <div className="flex flex-col gap-0.5">
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => navigate(c.value, currentPhase, currentTier, search)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                currentCategory === c.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* PDDRO 構面 — 只在 TTQS 類別顯示 */}
      {!isCourseOrRef && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">PDDRO 構面</p>
          <div className="flex flex-col gap-0.5">
            {PHASES.map((p) => (
              <button key={p.value} onClick={() => navigate(currentCategory, p.value, currentTier, search)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  currentPhase === p.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 文件階層 — 只在 TTQS 類別顯示 */}
      {!isCourseOrRef && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">文件階層</p>
          <div className="flex flex-col gap-0.5">
            {TIERS.map((t) => (
              <button key={t.value} onClick={() => navigate(currentCategory, currentPhase, t.value, search)}
                className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  currentTier === t.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
