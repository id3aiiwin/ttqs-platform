'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  profileId: string
  lineUserId: string | null
}

export function LineBindingSection({ profileId, lineUserId }: Props) {
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState(lineUserId ?? '')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/profile-signature', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: profileId, line_user_id: inputValue.trim() || null }),
      })
      setEditing(false)
      router.refresh()
    } catch { alert('儲存失敗') }
    setSaving(false)
  }

  if (lineUserId && !editing) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          <span className="text-sm text-green-700">已綁定</span>
        </div>
        <code className="text-xs text-gray-400 font-mono">{lineUserId.slice(0, 8)}...{lineUserId.slice(-4)}</code>
        <button onClick={() => { setEditing(true); setInputValue(lineUserId) }}
          className="text-xs text-indigo-600 hover:text-indigo-700">變更</button>
      </div>
    )
  }

  if (editing || !lineUserId) {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
          <p className="font-medium mb-1">如何取得 LINE User ID？</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>請學員加入 LINE 官方帳號</li>
            <li>學員在官方帳號聊天室傳送任意訊息</li>
            <li>從 LINE OA 後台 → 聊天 → 點擊學員 → 複製 User ID</li>
          </ol>
        </div>
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="LINE User ID（如 U1234abcd...）"
            className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button onClick={handleSave} disabled={saving}
            className="text-xs text-white bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 disabled:opacity-50">
            {saving ? '儲存...' : '儲存'}
          </button>
          {lineUserId && (
            <button onClick={() => setEditing(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-2">取消</button>
          )}
        </div>
      </div>
    )
  }

  return null
}
