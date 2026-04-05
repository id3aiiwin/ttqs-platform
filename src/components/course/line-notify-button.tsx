'use client'

import { useState, useEffect, useTransition } from 'react'

interface Template {
  id: string
  name: string
  content: string
  variables: string[]
}

interface Props {
  courseId: string
  courseTitle: string
  startDate: string | null
  hours: number | null
  trainer: string | null
}

export function LineNotifyButton({ courseId, courseTitle, startDate, hours, trainer }: Props) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [result, setResult] = useState<{ recipientCount: number; failedCount: number; totalRecipients: number; lineLinked: number; notLinked: number } | null>(null)
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const variableMap: Record<string, string> = {
    '課程名稱': courseTitle,
    '開課日期': startDate ?? '待定',
    '課程時數': hours != null ? String(hours) : '—',
    '講師姓名': trainer ?? '待定',
  }

  function replaceVariables(content: string) {
    let result = content
    for (const [key, value] of Object.entries(variableMap)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
    return result
  }

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/line-templates?category=student')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTemplates(data)
          if (data.length > 0 && !selectedId) setSelectedId(data[0].id)
        }
      })
      .finally(() => setLoading(false))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedTemplate = templates.find(t => t.id === selectedId)

  function getMessage() {
    if (isCustom) return customMessage
    if (selectedTemplate) return replaceVariables(selectedTemplate.content)
    return ''
  }

  function handleSend() {
    startTransition(async () => {
      // Use old API for student notification since it resolves enrolled students
      const res = await fetch('/api/line-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          custom_message: getMessage(),
        }),
      })
      const data = await res.json()
      if (data.error) {
        alert('發送失敗：' + data.error)
      } else {
        setResult(data)
      }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs text-green-600 hover:text-green-700 border border-green-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
        LINE 通知
      </button>
    )
  }

  return (
    <div className="bg-white border border-green-200 rounded-xl p-4 space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          發送 LINE 上課通知
        </h3>
        <button onClick={() => { setOpen(false); setResult(null) }} className="text-xs text-gray-400 hover:text-gray-600">關閉</button>
      </div>

      {result ? (
        <div className={`rounded-lg p-3 ${result.failedCount > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
          <p className="text-sm font-medium text-gray-900 mb-1">發送完成</p>
          <div className="text-xs text-gray-600 space-y-0.5">
            <p>學員總數：{result.totalRecipients ?? result.totalRecipients} 人</p>
            <p>已綁定 LINE：{result.lineLinked} 人</p>
            <p>成功發送：{result.recipientCount} 人</p>
            {result.notLinked > 0 && <p className="text-amber-600">未綁定 LINE：{result.notLinked} 人（無法收到通知）</p>}
            {result.failedCount > 0 && <p className="text-red-600">發送失敗：{result.failedCount} 人</p>}
          </div>
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-500">載入模板中...</p>
      ) : (
        <>
          {/* Template selection */}
          <div className="flex flex-wrap gap-2">
            {templates.map(t => (
              <button key={t.id}
                onClick={() => { setSelectedId(t.id); setIsCustom(false) }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${!isCustom && selectedId === t.id ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}>
                {t.name}
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isCustom ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'}`}>
              ✏️ 自訂
            </button>
          </div>

          {/* Message preview */}
          <div>
            <p className="text-xs text-gray-500 mb-1">訊息預覽</p>
            <div className="bg-green-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border border-green-100 max-h-32 overflow-y-auto">
              {isCustom ? (
                <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)}
                  rows={4} placeholder="自訂訊息內容..."
                  className="w-full text-sm border-0 bg-transparent focus:outline-none resize-none" />
              ) : getMessage()}
            </div>
          </div>

          <button onClick={handleSend} disabled={pending || (isCustom && !customMessage.trim())}
            className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {pending ? '發送中...' : '確認發送'}
          </button>
        </>
      )}
    </div>
  )
}
