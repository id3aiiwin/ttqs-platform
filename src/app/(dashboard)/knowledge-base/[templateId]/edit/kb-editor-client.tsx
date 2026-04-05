'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentEditor } from '@/components/form-builder/document-editor'
import type { FormSchema } from '@/types/form-schema'

interface Props {
  templateId: string
  schema: FormSchema
  companyName?: string
}

export function KbEditorClient({ templateId, schema: initialSchema, companyName }: Props) {
  const [schema, setSchema] = useState<FormSchema>(initialSchema)
  const [importing, setImporting] = useState(false)
  const router = useRouter()

  async function handleSave(updatedSchema: FormSchema) {
    // 同時存 structured_content 和從 static_text 欄位提取純文字到 content
    const plainText = extractPlainText(updatedSchema)

    const res = await fetch('/api/knowledge-base-templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: templateId,
        structured_content: updatedSchema,
        content: plainText || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      alert('儲存失敗：' + (data.error || '未知錯誤'))
    } else {
      router.refresh()
    }
  }

  async function handleImportDocx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const companyNames = prompt('請輸入要替換的企業名稱（多個用逗號分隔）：\n例如：桃源保全股份有限公司, 桃源保全')
      const fd = new FormData()
      fd.append('file', file)
      fd.append('company_names', companyNames || '')
      const res = await fetch('/api/parse-docx', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) { alert('解析失敗：' + data.error); return }
      if (data.detectedNames?.length > 0) {
        alert(`已自動替換：${data.detectedNames.join(', ')} → {{公司名稱}}`)
      }
      if (confirm(`解析出 ${data.schema.sections.length} 個區段，確定匯入？`)) {
        setSchema(data.schema)
      }
    } catch (err) { alert('匯入失敗：' + (err as Error).message) }
    finally { setImporting(false); e.target.value = '' }
  }

  return (
    <div>
      {/* Word 匯入 */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <label className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm cursor-pointer transition-colors
          ${importing ? 'border-gray-200 text-gray-400' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50'}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {importing ? '解析中...' : '從 Word 匯入'}
          <input type="file" className="hidden" accept=".docx" onChange={handleImportDocx} disabled={importing} />
        </label>
        <span className="text-xs text-gray-400">上傳 .docx 自動轉為文件內容</span>
      </div>

      <DocumentEditor schema={schema} onSave={handleSave} companyName={companyName} />
    </div>
  )
}

/** 從 structured_content 提取純文字（static_text 的 description + 其他欄位的 label） */
function extractPlainText(schema: FormSchema): string {
  const lines: string[] = [schema.title]
  for (const section of schema.sections) {
    if (section.title) lines.push('\n' + section.title)
    for (const field of section.fields) {
      if (field.type === 'static_text' && field.description) {
        lines.push(field.description)
      } else if (field.type === 'section_header') {
        lines.push('\n' + field.label)
      } else if (field.type === 'signature') {
        lines.push((field.signers ?? []).map(s => `${s}：　　　　日期：`).join('\n'))
      } else if (field.type === 'repeating_group') {
        const cols = (field.fields ?? []).map(f => f.label)
        lines.push(field.label + '：' + cols.join(' | '))
      } else {
        lines.push(field.label + '：_______________')
      }
    }
  }
  return lines.join('\n')
}
