'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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

export function KbFilter({ currentPhase, currentTier, currentSearch }: {
  currentPhase: string; currentTier: string; currentSearch: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(currentSearch)

  function navigate(phase: string, tier: string, s?: string) {
    const params = new URLSearchParams()
    if (phase) params.set('phase', phase)
    if (tier) params.set('tier', tier)
    if (s) params.set('search', s)
    router.push(`/knowledge-base${params.toString() ? '?' + params.toString() : ''}`)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 搜尋 */}
      <div>
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && navigate(currentPhase, currentTier, search)}
          placeholder="搜尋範本..."
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
      </div>

      {/* 構面 */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">PDDRO 構面</p>
        <div className="flex flex-col gap-0.5">
          {PHASES.map((p) => (
            <button key={p.value} onClick={() => navigate(p.value, currentTier, search)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                currentPhase === p.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 階層 */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">文件階層</p>
        <div className="flex flex-col gap-0.5">
          {TIERS.map((t) => (
            <button key={t.value} onClick={() => navigate(currentPhase, t.value, search)}
              className={`text-left text-sm px-3 py-1.5 rounded-lg transition-colors ${
                currentTier === t.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
