'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateTemplateFieldName,
  updateTemplateFieldType,
  toggleTemplateFieldRequired,
  deleteTemplateField,
} from '@/app/(dashboard)/companies/[id]/competency/templates/actions'

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: '單行文字',
  textarea: '多行文字',
  select: '下拉選單',
  rating: '等級評分',
  checkbox: '勾選',
  number: '數字',
  date: '日期',
}

interface Field {
  id: string
  field_name: string
  standard_name: string | null
  display_name: string | null
  field_type: string
  is_required: boolean
  default_field_id: string | null
}

interface CompetencyFieldItemProps {
  field: Field
  index: number
  companyId: string
  isConsultant: boolean
}

export function CompetencyFieldItem({ field, index, companyId, isConsultant }: CompetencyFieldItemProps) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(field.display_name ?? field.standard_name ?? field.field_name)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const isFromDefault = !!field.default_field_id
  const hasCustomName = field.display_name && field.standard_name && field.display_name !== field.standard_name

  function handleSaveName() {
    const trimmed = displayName.trim()
    if (trimmed && trimmed !== (field.display_name ?? field.standard_name)) {
      startTransition(async () => {
        await updateTemplateFieldName(field.id, trimmed, companyId)
        router.refresh()
      })
    }
    setEditing(false)
  }

  function handleTypeChange(newType: string) {
    startTransition(async () => {
      await updateTemplateFieldType(field.id, newType as 'text', companyId)
      router.refresh()
    })
  }

  function handleToggleRequired() {
    startTransition(async () => {
      await toggleTemplateFieldRequired(field.id, !field.is_required, companyId)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`確定刪除欄位「${displayName}」？`)) return
    startTransition(async () => {
      await deleteTemplateField(field.id, companyId)
      router.refresh()
    })
  }

  return (
    <div className="px-5 py-3 hover:bg-gray-50 transition-colors group flex items-center gap-3">
      {/* 序號 */}
      <span className="flex-shrink-0 text-xs font-mono text-gray-300 w-5 text-right">
        {index + 1}
      </span>

      {/* 名稱 */}
      <div className="flex-1 min-w-0">
        {editing && isConsultant ? (
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            className="text-sm w-full border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
        ) : (
          <p
            className={`text-sm text-gray-900 truncate ${isConsultant ? 'cursor-pointer' : ''}`}
            onDoubleClick={() => isConsultant && setEditing(true)}
            title={isConsultant ? '雙擊編輯名稱' : undefined}
          >
            {displayName}
          </p>
        )}
        {hasCustomName && (
          <p className="text-xs text-gray-400 truncate">公版：{field.standard_name}</p>
        )}
        {!isFromDefault && (
          <p className="text-xs text-indigo-400">自訂欄位</p>
        )}
      </div>

      {/* 必填 */}
      <button
        onClick={isConsultant ? handleToggleRequired : undefined}
        disabled={pending || !isConsultant}
        className={`flex-shrink-0 text-xs rounded-full px-2 py-0.5 border transition-colors ${
          field.is_required
            ? 'border-red-200 bg-red-50 text-red-600'
            : 'border-gray-200 bg-gray-50 text-gray-400'
        } ${isConsultant ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
        title={isConsultant ? '點擊切換必填' : undefined}
      >
        {field.is_required ? '必填' : '選填'}
      </button>

      {/* 欄位類型 */}
      {isConsultant ? (
        <select
          value={field.field_type}
          onChange={(e) => handleTypeChange(e.target.value)}
          disabled={pending}
          className="flex-shrink-0 text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-600 cursor-pointer"
        >
          {Object.entries(FIELD_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      ) : (
        <span className="flex-shrink-0 text-xs text-gray-400 border border-gray-200 rounded px-2 py-1">
          {FIELD_TYPE_LABELS[field.field_type] ?? field.field_type}
        </span>
      )}

      {/* 刪除（僅自訂欄位，且為顧問） */}
      {isConsultant && !isFromDefault && (
        <button
          onClick={handleDelete}
          disabled={pending}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
          title="刪除自訂欄位"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      {/* 公版欄位佔位，維持對齊 */}
      {isConsultant && isFromDefault && (
        <span className="flex-shrink-0 w-4" />
      )}
    </div>
  )
}
