'use client'

import { useState } from 'react'
import type { FormSchema, FormSection } from '@/types/form-schema'
import { SectionEditor } from './section-editor'
import { FormRenderer } from '@/components/form-renderer/form-renderer'

interface Props {
  schema: FormSchema
  onSave: (schema: FormSchema) => Promise<void>
  onReset?: () => Promise<void>
  companyName?: string
}

function generateSectionId() {
  return 'section_' + Math.random().toString(36).slice(2, 8)
}

export function FormSchemaEditor({ schema: initialSchema, onSave, onReset, companyName }: Props) {
  const [schema, setSchema] = useState<FormSchema>(initialSchema)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  function updateSection(index: number, section: FormSection) {
    const sections = [...schema.sections]
    sections[index] = section
    setSchema({ ...schema, sections })
  }

  function deleteSection(index: number) {
    if (!confirm('確定刪除此區段？')) return
    setSchema({ ...schema, sections: schema.sections.filter((_, i) => i !== index) })
  }

  function addSection() {
    const newSection: FormSection = {
      id: generateSectionId(),
      title: '新區段',
      fields: [],
    }
    setSchema({ ...schema, sections: [...schema.sections, newSection] })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(schema)
    } finally {
      setSaving(false)
    }
  }

  if (preview) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">預覽模式</h3>
          <button
            type="button"
            onClick={() => setPreview(false)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            返回編輯
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <FormRenderer
            schema={schema}
            onSubmit={async () => {}}
            companyName={companyName}
            disabled
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 標題編輯 */}
      <div className="space-y-2">
        <div>
          <label className="text-xs text-gray-500">表單標題</label>
          <input
            type="text"
            value={schema.title}
            onChange={(e) => setSchema({ ...schema, title: e.target.value })}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">副標題（表號）</label>
          <input
            type="text"
            value={schema.subtitle ?? ''}
            onChange={(e) => setSchema({ ...schema, subtitle: e.target.value || undefined })}
            placeholder="例：4FM-TR001-4-1-1"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 區段列表 */}
      <div className="space-y-3">
        {schema.sections.map((section, i) => (
          <SectionEditor
            key={section.id + i}
            section={section}
            onChange={(s) => updateSection(i, s)}
            onDelete={() => deleteSection(i)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addSection}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
      >
        + 新增區段
      </button>

      {/* 操作列 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPreview(true)}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            預覽
          </button>
          {onReset && (
            <button
              type="button"
              onClick={async () => {
                if (confirm('確定重置為系統預設？自訂內容將被清除。')) {
                  await onReset()
                }
              }}
              className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              重置為預設
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? '儲存中...' : '儲存模板'}
        </button>
      </div>
    </div>
  )
}
