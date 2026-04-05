'use client'

import { useState, useEffect, useCallback } from 'react'

interface Props {
  productId: string
  contentUrl: string
  userId: string
  attempts: { id: string; score: number | null; percentage: number | null; summary: string | null; completed_at: string }[]
}

export function QuizPlayer({ productId, contentUrl, userId, attempts }: Props) {
  const [playing, setPlaying] = useState(false)
  const [saving, setSaving] = useState(false)

  // 監聽 iframe postMessage
  const handleMessage = useCallback(async (event: MessageEvent) => {
    if (event.data?.type === 'quizResult') {
      setSaving(true)
      await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          product_id: productId,
          score: event.data.score ?? null,
          total: event.data.total ?? null,
          percentage: event.data.percentage ?? null,
          summary: event.data.summary ?? null,
          result_data: event.data,
        }),
      })
      setSaving(false)
      setPlaying(false)
      window.location.reload()
    }
  }, [productId, userId])

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])

  if (playing) {
    return (
      <div>
        {saving && <div className="text-center text-indigo-600 text-sm mb-2 animate-pulse">儲存結果中...</div>}
        <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '70vh' }}>
          <iframe src={contentUrl} className="w-full h-full border-0" allow="clipboard-read; clipboard-write" />
        </div>
        <button onClick={() => setPlaying(false)} className="text-xs text-gray-400 mt-2">關閉測驗</button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => setPlaying(true)}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
        {attempts.length > 0 ? '🔄 重新作答' : '🧪 開始測驗'}
      </button>

      {attempts.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">作答紀錄（{attempts.length} 次）</p>
          <div className="space-y-2">
            {attempts.map((a, i) => (
              <div key={a.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400">第 {attempts.length - i} 次</span>
                  {a.summary && <span className="text-sm text-gray-700 ml-2">{a.summary}</span>}
                </div>
                <div className="text-right">
                  {a.percentage !== null && <span className="text-sm font-bold text-indigo-600">{a.percentage}%</span>}
                  <p className="text-xs text-gray-400">{new Date(a.completed_at).toLocaleDateString('zh-TW')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
