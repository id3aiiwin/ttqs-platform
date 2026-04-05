'use client'

import { useState, useCallback } from 'react'
import type { FormSchema, FormResponseData } from '@/types/form-schema'
import { SectionRenderer } from './section-renderer'

interface FormRendererProps {
  schema: FormSchema
  initialData?: FormResponseData
  onSubmit: (data: FormResponseData) => Promise<void>
  disabled?: boolean
  companyName?: string
}

export function FormRenderer({ schema, initialData, onSubmit, disabled, companyName }: FormRendererProps) {
  const [formData, setFormData] = useState<FormResponseData>(initialData ?? {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const title = companyName
    ? schema.title.replace(/\{company_name\}/g, companyName)
    : schema.title

  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    setSaved(false)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSubmit(formData)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 表單標題 */}
      <div className="text-center border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {schema.subtitle && (
          <p className="text-sm text-gray-400 mt-1">{schema.subtitle}</p>
        )}
      </div>

      {/* 各區段 */}
      {schema.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          formData={formData}
          onChange={handleFieldChange}
          disabled={disabled}
          companyName={companyName}
        />
      ))}

      {/* 送出按鈕 */}
      {!disabled && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              已儲存
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? '儲存中...' : '儲存表單'}
          </button>
        </div>
      )}
    </form>
  )
}
