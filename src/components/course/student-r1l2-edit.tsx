'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const PATTERN_OPTIONS = ['正箕', '反箕', '弧形', '帳蓬弧', '環形', '雙箕', '螺旋', '孔雀眼']

interface Props {
  profileId: string
  currentR1: string | null
  currentL2: string | null
}

export function StudentR1L2Edit({ profileId, currentR1, currentL2 }: Props) {
  const [r1, setR1] = useState(currentR1 ?? '')
  const [l2, setL2] = useState(currentL2 ?? '')
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    startTransition(async () => {
      await fetch('/api/role-management', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profileId,
          r1_pattern: r1 || null,
          l2_pattern: l2 || null,
        }),
      })
      setEditing(false)
      router.refresh()
    })
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">R1:</span>
        <span className="text-gray-900 font-medium">{currentR1 || '—'}</span>
        <span className="text-gray-500 ml-2">L2:</span>
        <span className="text-gray-900 font-medium">{currentL2 || '—'}</span>
        <button onClick={() => setEditing(true)} className="text-xs text-indigo-600 hover:text-indigo-700 ml-2">編輯</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div>
        <label className="text-xs text-gray-500">R1 管理力</label>
        <select value={r1} onChange={e => setR1(e.target.value)} className="block text-sm border border-gray-200 rounded px-2 py-1 mt-0.5">
          <option value="">未填</option>
          {PATTERN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500">L2 心像力</label>
        <select value={l2} onChange={e => setL2(e.target.value)} className="block text-sm border border-gray-200 rounded px-2 py-1 mt-0.5">
          <option value="">未填</option>
          {PATTERN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <button onClick={handleSave} disabled={pending} className="text-xs bg-indigo-600 text-white rounded px-2 py-1 mt-4 disabled:opacity-50">
        {pending ? '...' : '儲存'}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-gray-400 mt-4">取消</button>
    </div>
  )
}
