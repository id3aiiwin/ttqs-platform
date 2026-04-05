'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addTemplateField } from '@/app/(dashboard)/companies/[id]/competency/templates/actions'

type FieldType = 'text' | 'textarea' | 'select' | 'rating' | 'checkbox' | 'number' | 'date'

export function AddCompetencyField({ companyId, formType }: { companyId: string; formType: string }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState<FieldType>('text')
  const [isRequired, setIsRequired] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAdd() {
    if (!name.trim()) return
    const fieldName = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_\u4e00-\u9fff]/g, '')
    startTransition(async () => {
      await addTemplateField(companyId, formType, {
        fieldName: fieldName || `custom_${Date.now()}`,
        displayName: name.trim(),
        fieldType,
        isRequired,
      })
      setName('')
      setFieldType('text')
      setIsRequired(false)
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
      >
        + 新增自訂欄位
      </button>
    )
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="欄位名稱..."
          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500"
          autoFocus
        />
        <select
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as FieldType)}
          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
        >
          <option value="text">單行文字</option>
          <option value="textarea">多行文字</option>
          <option value="number">數字</option>
          <option value="date">日期</option>
          <option value="rating">等級評分</option>
          <option value="select">下拉選單</option>
          <option value="checkbox">勾選</option>
        </select>
        <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            className="rounded border-gray-300"
          />
          必填
        </label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={pending || !name.trim()}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:text-gray-300 px-2 py-1"
        >
          加入
        </button>
        <button
          onClick={() => { setOpen(false); setName('') }}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
        >
          取消
        </button>
      </div>
    </div>
  )
}
