'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  signatureId: string
  signerRole: string
  signatureUrl: string | null
}

export function SignAction({ signatureId, signerRole, signatureUrl }: Props) {
  const [rejecting, setRejecting] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSign() {
    if (!confirm(`確定以「${signerRole}」身份簽署此文件？`)) return
    startTransition(async () => {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign', signature_id: signatureId }),
      })
      router.refresh()
    })
  }

  function handleReject() {
    startTransition(async () => {
      await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', signature_id: signatureId, comment: rejectComment }),
      })
      setRejecting(false)
      router.refresh()
    })
  }

  if (rejecting) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-red-700">退回文件</p>
        <textarea
          value={rejectComment}
          onChange={e => setRejectComment(e.target.value)}
          placeholder="請輸入退回原因..."
          rows={2}
          className="w-full text-xs border border-red-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
          autoFocus
        />
        <div className="flex gap-2">
          <button onClick={handleReject} disabled={pending}
            className="text-xs text-white bg-red-600 hover:bg-red-700 rounded px-3 py-1 disabled:opacity-50">確定退回</button>
          <button onClick={() => { setRejecting(false); setRejectComment('') }}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">取消</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
      <p className="text-xs text-indigo-700 mb-2">輪到 <strong>{signerRole}</strong> 簽核</p>

      {signatureUrl && (
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-gray-500">簽名預覽：</span>
          <img
            src={`/api/download?path=${encodeURIComponent(signatureUrl)}`}
            alt="簽名"
            className="h-10 max-w-[120px] object-contain border border-gray-200 rounded bg-white px-2"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleSign} disabled={pending}
          className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded px-4 py-1.5 disabled:opacity-50">
          {pending ? '簽署中...' : '確認簽署'}
        </button>
        <button onClick={() => setRejecting(true)} disabled={pending}
          className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5">
          退回
        </button>
      </div>
    </div>
  )
}
