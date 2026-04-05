'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  updateTemplateName,
  updateTemplateType,
  deleteTemplateItem,
  confirmTemplateItem,
} from '@/app/(dashboard)/companies/[id]/templates/actions'
import { FORM_TYPE_LABELS } from '@/lib/pddro-defaults'
import type { CompanyFormTemplate } from '@/types/database'

export function TemplateItem({ item, companyId }: { item: CompanyFormTemplate; companyId: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const typeInfo = FORM_TYPE_LABELS[item.form_type]
  const needsAction = item.needs_customization && !item.is_confirmed

  function handleSaveName() {
    if (name.trim() && name !== item.name) {
      startTransition(async () => {
        await updateTemplateName(item.id, name.trim(), companyId)
        router.refresh()
      })
    }
    setEditing(false)
  }

  function handleTypeChange(newType: string) {
    startTransition(async () => {
      await updateTemplateType(item.id, newType as 'online' | 'upload' | 'auto', companyId)
      router.refresh()
    })
  }

  function handleConfirm() {
    startTransition(async () => {
      await confirmTemplateItem(item.id, companyId)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`確定刪除「${item.name}」？`)) return
    startTransition(async () => {
      await deleteTemplateItem(item.id, companyId)
      router.refresh()
    })
  }

  return (
    <div className={`mx-5 px-3 py-2.5 rounded-lg transition-colors group flex items-center gap-3
      ${needsAction ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-gray-50'}`}
    >
      {/* TTQS 指標編號 */}
      {item.ttqs_indicator && (
        <span className="flex-shrink-0 text-xs font-mono text-gray-400 w-8 text-right">
          {item.ttqs_indicator}
        </span>
      )}

      {/* 名稱 */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
            className="text-sm w-full border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500"
            autoFocus
          />
        ) : (
          <p
            className="text-sm text-gray-800 truncate cursor-pointer"
            onDoubleClick={() => setEditing(true)}
            title="雙擊編輯名稱"
          >
            {item.name}
          </p>
        )}
        {item.standard_name && item.name !== item.standard_name && (
          <p className="text-xs text-gray-400 truncate">公版：{item.standard_name}</p>
        )}
      </div>

      {/* 確認狀態 badge（僅 needs_customization 的項目顯示） */}
      {item.needs_customization && (
        needsAction ? (
          <button
            onClick={handleConfirm}
            disabled={pending}
            className="flex-shrink-0 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-200 transition-colors"
            title="確認此項目已依企業需求調整"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
            待確認
          </button>
        ) : (
          <span
            className="flex-shrink-0 inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
            title={item.confirmed_at ? `確認於 ${new Date(item.confirmed_at).toLocaleDateString('zh-TW')}` : ''}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            已確認
          </span>
        )
      )}

      {/* 編輯欄位 */}
      <Link
        href={`/companies/${companyId}/templates/${item.id}/fields`}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs text-indigo-500 hover:text-indigo-700 transition-all px-2 py-0.5 rounded border border-indigo-200 hover:border-indigo-300"
        title="編輯表單欄位"
      >
        欄位
      </Link>

      {/* 表單類型 */}
      <select
        value={item.form_type}
        onChange={(e) => handleTypeChange(e.target.value)}
        disabled={pending}
        className={`flex-shrink-0 text-xs rounded border px-2 py-1 cursor-pointer ${typeInfo.color}`}
      >
        <option value="online">{FORM_TYPE_LABELS.online.icon} 線上填寫</option>
        <option value="upload">{FORM_TYPE_LABELS.upload.icon} 上傳文件</option>
        <option value="auto">{FORM_TYPE_LABELS.auto.icon} 自動連動</option>
      </select>

      {/* 刪除 */}
      <button
        onClick={handleDelete}
        disabled={pending}
        className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
        title="刪除"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
