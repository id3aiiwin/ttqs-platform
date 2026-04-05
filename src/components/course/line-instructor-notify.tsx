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
  trainerName: string | null
  surveyId: string | null
}

export function LineInstructorNotify({ courseId, courseTitle, startDate, trainerName, surveyId }: Props) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const surveyUrl = surveyId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/survey/${surveyId}` : null

  const variableMap: Record<string, string> = {
    '講師姓名': trainerName ?? '老師',
    '課程名稱': courseTitle,
    '開課日期': startDate ?? '近期',
    '問卷連結': surveyUrl ?? '(尚未建立問卷)',
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
    fetch('/api/line-templates?category=instructor')
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
      const res = await fetch('/api/line-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: isCustom ? undefined : selectedId,
          message: isCustom ? customMessage : undefined,
          recipients: [{ line_user_id: '__resolve__', name: trainerName }],
          category: 'instructor',
          context_type: 'course',
          context_id: courseId,
          variables: isCustom ? undefined : variableMap,
        }),
      })
      // Fallback: use old API if new one fails for recipient resolution
      if (!res.ok) {
        const fallbackRes = await fetch('/api/line-instructor-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: courseId, trainer_name: trainerName, message: getMessage() }),
        })
        const data = await fallbackRes.json()
        setResult(data)
        return
      }
      const data = await res.json()
      setResult(data)
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755z" />
        </svg>
        LINE 通知講師
      </button>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-green-800">LINE 通知講師</p>
        <button onClick={() => { setOpen(false); setResult(null) }} className="text-xs text-gray-400">關閉</button>
      </div>

      {result ? (
        <div className={`rounded-lg p-3 text-sm ${result.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {result.ok ? '已發送通知' : `發送失敗：${result.error}`}
          <button onClick={() => setResult(null)} className="text-xs underline ml-2">重新發送</button>
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-500">載入模板中...</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {templates.map(t => (
              <button key={t.id}
                onClick={() => { setSelectedId(t.id); setIsCustom(false) }}
                className={`text-xs px-3 py-1.5 rounded-lg ${!isCustom && selectedId === t.id ? 'bg-green-600 text-white' : 'bg-white text-green-700 border border-green-200'}`}>
                {t.name}
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className={`text-xs px-3 py-1.5 rounded-lg ${isCustom ? 'bg-green-600 text-white' : 'bg-white text-green-700 border border-green-200'}`}>
              ✏️ 自訂
            </button>
          </div>

          <div className="bg-white rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border border-green-100 max-h-32 overflow-y-auto">
            {isCustom ? (
              <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)}
                rows={4} placeholder="自訂訊息內容..."
                className="w-full text-sm border-0 focus:outline-none resize-none" />
            ) : getMessage()}
          </div>

          <button onClick={handleSend} disabled={pending || (isCustom && !customMessage.trim())}
            className="w-full py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
            {pending ? '發送中...' : '確認發送'}
          </button>
        </>
      )}
    </div>
  )
}
