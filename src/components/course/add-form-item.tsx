'use client'

import { useState, useTransition } from 'react'
import { addCourseForm } from '@/app/(dashboard)/courses/form-actions'
import { useRouter } from 'next/navigation'

type PddroPhase = 'P' | 'D' | 'DO' | 'R' | 'O'

interface AddFormItemProps {
  courseId: string
  phase: PddroPhase
}

export function AddFormItem({ courseId, phase }: AddFormItemProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [formType, setFormType] = useState<'online' | 'upload' | 'auto'>('online')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAdd() {
    if (!name.trim()) return
    startTransition(async () => {
      await addCourseForm(courseId, phase, name.trim(), formType)
      setName('')
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mx-5 px-3 py-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
      >
        + 新增自訂項目
      </button>
    )
  }

  return (
    <div className="mx-5 px-3 py-2 bg-gray-50 rounded-lg flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder="表單名稱..."
        className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
        autoFocus
      />
      <select
        value={formType}
        onChange={(e) => setFormType(e.target.value as 'online' | 'upload' | 'auto')}
        className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white"
      >
        <option value="online">線上填寫</option>
        <option value="upload">上傳文件</option>
        <option value="auto">自動連動</option>
      </select>
      <button
        onClick={handleAdd}
        disabled={pending || !name.trim()}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:text-gray-300 px-2 py-1"
      >
        加入
      </button>
      <button
        onClick={() => { setOpen(false); setName('') }}
        className="text-xs text-gray-400 hover:text-gray-600 px-1"
      >
        取消
      </button>
    </div>
  )
}
