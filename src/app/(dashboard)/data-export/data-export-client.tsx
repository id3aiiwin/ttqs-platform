'use client'

import { useState } from 'react'

interface ExportItem {
  type: string
  label: string
  description: string
  icon: string
}

const exportItems: ExportItem[] = [
  { type: 'companies', label: '企業資料', description: '匯出所有企業基本資料，包含名稱、狀態、產業等', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { type: 'profiles', label: '人員資料', description: '匯出所有使用者資料，包含姓名、信箱、角色等', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { type: 'courses', label: '課程資料', description: '匯出所有課程記錄，包含名稱、狀態、時數、收入等', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { type: 'survey_responses', label: '問卷回覆', description: '匯出問卷回覆資料，包含課程名稱及各項評分', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { type: 'interactions', label: '互動紀錄', description: '匯出所有客戶互動紀錄，包含聯繫日期、方式、摘要等', icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
  { type: 'todos', label: '待辦事項', description: '匯出所有待辦事項，包含標題、狀態、優先級、到期日等', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
]

export function DataExportClient() {
  const [loading, setLoading] = useState<string | null>(null)
  const [lastExported, setLastExported] = useState<Record<string, string>>({})

  const handleExport = async (type: string) => {
    setLoading(type)
    try {
      const res = await fetch(`/api/data-export?type=${type}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '匯出失敗' }))
        alert(err.error || '匯出失敗')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const disposition = res.headers.get('Content-Disposition')
      const filename = disposition?.match(/filename="?(.+?)"?$/)?.[1] || `${type}.csv`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setLastExported(prev => ({ ...prev, [type]: new Date().toLocaleString('zh-TW') }))
    } catch {
      alert('匯出失敗，請稍後再試')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {exportItems.map(item => (
        <div key={item.type} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
            {lastExported[item.type] && (
              <p className="text-[10px] text-gray-400 mt-1">最後匯出：{lastExported[item.type]}</p>
            )}
          </div>
          <button
            onClick={() => handleExport(item.type)}
            disabled={loading !== null}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 flex-shrink-0"
          >
            {loading === item.type ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                匯出中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                匯出 CSV
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
