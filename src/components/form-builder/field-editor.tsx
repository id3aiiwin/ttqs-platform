'use client'

import { useState } from 'react'
import type { FormFieldDefinition, PddroFieldType } from '@/types/form-schema'
import { FieldTypeSelector } from './field-type-selector'
import { OptionsEditor } from './options-editor'

interface Props {
  field: FormFieldDefinition
  onChange: (field: FormFieldDefinition) => void
  onDelete: () => void
}

const NEEDS_OPTIONS: PddroFieldType[] = ['radio', 'checkbox', 'select']

export function FieldEditor({ field, onChange, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)

  function update(partial: Partial<FormFieldDefinition>) {
    onChange({ ...field, ...partial })
  }

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      {/* 摘要列 */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button type="button" onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600">
          <svg className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <input
          type="text"
          value={field.label}
          onChange={(e) => update({ label: e.target.value })}
          placeholder="欄位名稱"
          className="flex-1 text-sm border-0 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none py-0.5 px-1"
        />

        <FieldTypeSelector value={field.type} onChange={(type) => update({ type })} />

        <label className="flex items-center gap-1 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={field.required ?? false}
            onChange={(e) => update({ required: e.target.checked })}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          必填
        </label>

        <button type="button" onClick={onDelete} className="text-gray-300 hover:text-red-500 ml-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* 展開詳細設定 */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">欄位 ID</label>
              <input
                type="text"
                value={field.id}
                onChange={(e) => update({ id: e.target.value })}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Placeholder</label>
              <input
                type="text"
                value={field.placeholder ?? ''}
                onChange={(e) => update({ placeholder: e.target.value || undefined })}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">說明文字</label>
            <input
              type="text"
              value={field.description ?? ''}
              onChange={(e) => update({ description: e.target.value || undefined })}
              className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">自動帶入</label>
              <select
                value={field.auto_populate ?? ''}
                onChange={(e) => update({ auto_populate: e.target.value || undefined })}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">無</option>
                <option value="course.title">課程名稱</option>
                <option value="course.start_date">開始日期</option>
                <option value="course.end_date">結束日期</option>
                <option value="course.hours">課程時數</option>
                <option value="course.trainer">講師</option>
                <option value="course.venue">上課地點</option>
                <option value="course.target">訓練對象</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">佔欄數</label>
              <select
                value={field.columns ?? ''}
                onChange={(e) => update({ columns: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">預設</option>
                <option value="1">1 欄</option>
                <option value="2">2 欄</option>
                <option value="3">3 欄</option>
                <option value="4">4 欄</option>
              </select>
            </div>
            {(field.type === 'number' || field.type === 'rating') && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">最小</label>
                  <input type="number" value={field.min ?? ''} onChange={(e) => update({ min: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">最大</label>
                  <input type="number" value={field.max ?? ''} onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
            )}
          </div>

          {NEEDS_OPTIONS.includes(field.type) && (
            <OptionsEditor
              options={field.options ?? []}
              onChange={(options) => update({ options })}
            />
          )}

          {field.type === 'signature' && (
            <div>
              <label className="text-xs text-gray-500">簽核人（逗號分隔）</label>
              <input
                type="text"
                value={(field.signers ?? []).join(', ')}
                onChange={(e) => update({ signers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="例：承辦人, 主管, 總經理"
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
