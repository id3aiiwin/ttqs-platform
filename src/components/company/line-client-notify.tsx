'use client'

import { useState, useEffect, useTransition } from 'react'

interface Template {
  id: string
  name: string
  content: string
  variables: string[]
}

interface Props {
  companyId: string
  companyName: string
  contactPerson?: string | null
}

export function LineClientNotify({ companyId, companyName, contactPerson }: Props) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string; recipientCount?: number } | null>(null)
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const variableMap: Record<string, string> = {
    '企業名稱': companyName,
    '聯繫人姓名': contactPerson ?? '您',
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
    fetch('/api/line-templates?category=client')
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
      // First, resolve contact person's LINE user ID
      const lookupRes = await fetch(`/api/line-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: isCustom ? undefined : selectedId,
          message: getMessage(),
          recipients: [{ line_user_id: '', name: contactPerson || companyName }],
          category: 'client',
          context_type: 'company',
          context_id: companyId,
          variables: isCustom ? undefined : variableMap,
        }),
      })
      const data = await lookupRes.json()
      if (!lookupRes.ok) {
        setResult({ error: data.error })
      } else {
        setResult({ ok: true, recipientCount: data.recipientCount })
      }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs text-green-600 hover:text-green-700 border border-green-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755z" />
        </svg>
        LINE 通知客戶
      </button>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-amber-800">LINE 通知客戶</p>
        <button onClick={() => { setOpen(false); setResult(null) }} className="text-xs text-gray-400">關閉</button>
      </div>

      {result ? (
        <div className={`rounded-lg p-3 text-sm ${result.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {result.ok
            ? `已發送通知${result.recipientCount ? `（成功 ${result.recipientCount} 人）` : ''}`
            : `發送失敗：${result.error}`}
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
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${!isCustom && selectedId === t.id ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100'}`}>
                {t.name}
              </button>
            ))}
            <button
              onClick={() => setIsCustom(true)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${isCustom ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-100'}`}>
              ✏️ 自訂
            </button>
          </div>

          <div className="bg-white rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border border-amber-100 max-h-32 overflow-y-auto">
            {isCustom ? (
              <textarea value={customMessage} onChange={e => setCustomMessage(e.target.value)}
                rows={4} placeholder="自訂訊息內容..."
                className="w-full text-sm border-0 focus:outline-none resize-none" />
            ) : getMessage()}
          </div>

          {!contactPerson && (
            <p className="text-xs text-amber-600">此企業尚未設定聯繫人，發送可能無法送達。</p>
          )}

          <button onClick={handleSend} disabled={pending || (isCustom && !customMessage.trim())}
            className="w-full py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors">
            {pending ? '發送中...' : '確認發送'}
          </button>
        </>
      )}
    </div>
  )
}
