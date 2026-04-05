'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDocument } from '@/app/(dashboard)/companies/[id]/documents/actions'

export function AddDocumentForm({ companyId, tier }: { companyId: string; tier: number }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAdd() {
    if (!title.trim()) return
    startTransition(async () => {
      await addDocument(companyId, {
        title: title.trim(),
        tier,
        doc_number: docNumber.trim() || undefined,
        source: 'upload',
      })
      setTitle('')
      setDocNumber('')
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors flex items-center justify-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        新增文件
      </button>
    )
  }

  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={docNumber}
          onChange={(e) => setDocNumber(e.target.value)}
          placeholder="文件編號（選填）"
          className="w-32 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="文件名稱 *"
          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
          autoFocus
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={pending || !title.trim()}
          className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50"
        >
          新增
        </button>
        <button
          onClick={() => { setOpen(false); setTitle(''); setDocNumber('') }}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5"
        >
          取消
        </button>
      </div>
    </div>
  )
}
