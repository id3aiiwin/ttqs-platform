'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ChangePassword() {
  const [open, setOpen] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit() {
    setError(null)
    if (newPwd.length < 6) { setError('密碼至少 6 個字元'); return }
    if (newPwd !== confirm) { setError('兩次密碼不一致'); return }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPwd })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setNewPwd('')
      setConfirm('')
      setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
    }
    setLoading(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
        修改密碼
      </button>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-500">新密碼</label>
        <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
          placeholder="至少 6 個字元"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mt-0.5" />
      </div>
      <div>
        <label className="text-xs text-gray-500">確認新密碼</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          placeholder="再次輸入"
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mt-0.5" />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-green-600">密碼已更新</p>}
      <div className="flex gap-2">
        <button onClick={handleSubmit} disabled={loading}
          className="text-sm bg-indigo-600 text-white rounded-lg px-4 py-1.5 hover:bg-indigo-700 disabled:opacity-50">
          {loading ? '更新中...' : '確認更新'}
        </button>
        <button onClick={() => { setOpen(false); setError(null) }}
          className="text-sm text-gray-400 px-3">取消</button>
      </div>
    </div>
  )
}
