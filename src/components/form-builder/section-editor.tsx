'use client'

import { useState } from 'react'
import type { FormSection, FormFieldDefinition } from '@/types/form-schema'
import { FieldEditor } from './field-editor'

interface Props {
  section: FormSection
  onChange: (section: FormSection) => void
  onDelete: () => void
}

function generateId() {
  return 'field_' + Math.random().toString(36).slice(2, 8)
}

export function SectionEditor({ section, onChange, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  function updateField(index: number, field: FormFieldDefinition) {
    const fields = [...section.fields]
    fields[index] = field
    onChange({ ...section, fields })
  }

  function deleteField(index: number) {
    onChange({ ...section, fields: section.fields.filter((_, i) => i !== index) })
  }

  function addField() {
    const newField: FormFieldDefinition = {
      id: generateId(),
      label: '新欄位',
      type: 'text',
    }
    onChange({ ...section, fields: [...section.fields, newField] })
  }

  function moveField(from: number, to: number) {
    if (to < 0 || to >= section.fields.length) return
    const fields = [...section.fields]
    const [moved] = fields.splice(from, 1)
    fields.splice(to, 0, moved)
    onChange({ ...section, fields })
  }

  return (
    <div className="border border-gray-300 rounded-xl bg-gray-50/50">
      {/* Section header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
        <button type="button" onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-gray-600">
          <svg className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <input
          type="text"
          value={section.title ?? ''}
          onChange={(e) => onChange({ ...section, title: e.target.value || undefined })}
          placeholder="區段標題（選填）"
          className="flex-1 text-sm font-medium bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-indigo-500 focus:outline-none py-0.5"
        />

        <span className="text-xs text-gray-400">{section.fields.length} 欄位</span>

        <button type="button" onClick={onDelete} className="text-gray-300 hover:text-red-500" title="刪除區段">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Section description */}
      {!collapsed && (
        <div className="px-4 pt-2">
          <input
            type="text"
            value={section.description ?? ''}
            onChange={(e) => onChange({ ...section, description: e.target.value || undefined })}
            placeholder="區段說明（選填）"
            className="w-full text-xs text-gray-500 bg-transparent border-0 border-b border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none py-0.5"
          />
        </div>
      )}

      {/* Fields */}
      {!collapsed && (
        <div className="p-4 space-y-2">
          {section.fields.map((field, i) => (
            <div key={field.id + i} className="flex items-start gap-1">
              <div className="flex flex-col gap-0.5 pt-2">
                <button type="button" onClick={() => moveField(i, i - 1)} disabled={i === 0}
                  className="text-gray-300 hover:text-gray-500 disabled:opacity-30">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button type="button" onClick={() => moveField(i, i + 1)} disabled={i === section.fields.length - 1}
                  className="text-gray-300 hover:text-gray-500 disabled:opacity-30">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="flex-1">
                <FieldEditor
                  field={field}
                  onChange={(f) => updateField(i, f)}
                  onDelete={() => deleteField(i)}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addField}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
          >
            + 新增欄位
          </button>
        </div>
      )}
    </div>
  )
}
