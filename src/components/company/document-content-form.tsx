'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { FormSchema, FormSection, FormFieldDefinition } from '@/types/form-schema'

interface Props {
  documentId: string
  companyId: string
  companyName: string
  schema: FormSchema
  filledContent: Record<string, unknown>
}

export function DocumentContentForm({ documentId, companyId, companyName, schema, filledContent }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(filledContent ?? {})
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function setValue(fieldId: string, value: unknown) {
    setValues(prev => ({ ...prev, [fieldId]: value }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const res = await fetch('/api/company-documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId, filled_content: values }),
      })
      if (res.ok) {
        setSaved(true)
        router.refresh()
      } else {
        const data = await res.json()
        alert('儲存失敗：' + (data.error || '未知錯誤'))
      }
    })
  }

  // Replace {{公司名稱}} in title
  const title = schema.title?.replace(/\{\{公司名稱\}\}/g, companyName) ?? ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-600">已儲存</span>}
          <button onClick={handleSave} disabled={pending}
            className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 disabled:opacity-50">
            {pending ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>

      {schema.sections.map((section, si) => (
        <SectionRenderer key={section.id || si} section={section} values={values}
          setValue={setValue} companyName={companyName} />
      ))}
    </div>
  )
}

function SectionRenderer({ section, values, setValue, companyName }: {
  section: FormSection
  values: Record<string, unknown>
  setValue: (id: string, val: unknown) => void
  companyName: string
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {section.title && (
        <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-800">
            {section.title.replace(/\{\{公司名稱\}\}/g, companyName)}
          </p>
          {section.description && (
            <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
          )}
        </div>
      )}
      <div className="p-4 space-y-4">
        {section.fields.map((field, fi) => (
          <FieldRenderer key={field.id || fi} field={field} values={values}
            setValue={setValue} companyName={companyName} />
        ))}
      </div>
    </div>
  )
}

function FieldRenderer({ field, values, setValue, companyName }: {
  field: FormFieldDefinition
  values: Record<string, unknown>
  setValue: (id: string, val: unknown) => void
  companyName: string
}) {
  const val = values[field.id]

  if (field.type === 'static_text') {
    return (
      <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
        {(field.description || field.label).replace(/\{\{公司名稱\}\}/g, companyName)}
      </div>
    )
  }

  if (field.type === 'section_header') {
    return (
      <h4 className="text-sm font-semibold text-gray-800 pt-2 border-t border-gray-100">
        {field.label.replace(/\{\{公司名稱\}\}/g, companyName)}
      </h4>
    )
  }

  if (field.type === 'signature') {
    return (
      <div className="border border-gray-200 rounded-lg p-3">
        <p className="text-xs text-gray-500 mb-2">{field.label}</p>
        <div className="flex gap-4">
          {(field.signers ?? []).map((signer, i) => (
            <div key={i} className="text-center">
              <div className="w-20 h-12 border-b-2 border-gray-300 mb-1" />
              <p className="text-xs text-gray-500">{signer}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const label = field.label.replace(/\{\{公司名稱\}\}/g, companyName)

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {field.required && <span className="text-red-400">*</span>}
        </label>
        {field.description && <p className="text-xs text-gray-400 mb-1">{field.description}</p>}
        <textarea value={(val as string) ?? ''} onChange={e => setValue(field.id, e.target.value)}
          rows={3} placeholder={field.placeholder ?? ''}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
    )
  }

  if (field.type === 'text') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {field.required && <span className="text-red-400">*</span>}
        </label>
        {field.description && <p className="text-xs text-gray-400 mb-1">{field.description}</p>}
        <input type="text" value={(val as string) ?? ''} onChange={e => setValue(field.id, e.target.value)}
          placeholder={field.placeholder ?? ''}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
    )
  }

  if (field.type === 'number') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <input type="number" value={(val as number) ?? ''} onChange={e => setValue(field.id, e.target.value ? Number(e.target.value) : '')}
          min={field.min} max={field.max}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
    )
  }

  if (field.type === 'date') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <input type="date" value={(val as string) ?? ''} onChange={e => setValue(field.id, e.target.value)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
    )
  }

  if (field.type === 'radio' && field.options) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex flex-wrap gap-3">
          {field.options.map(opt => (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="radio" name={field.id} value={opt.value}
                checked={val === opt.value} onChange={() => setValue(field.id, opt.value)}
                className="text-indigo-600" />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'checkbox' && field.options) {
    const selected = (val as string[]) ?? []
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex flex-wrap gap-3">
          {field.options.map(opt => (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input type="checkbox" value={opt.value}
                checked={selected.includes(opt.value)}
                onChange={e => {
                  if (e.target.checked) setValue(field.id, [...selected, opt.value])
                  else setValue(field.id, selected.filter(v => v !== opt.value))
                }}
                className="rounded text-indigo-600" />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'file_upload') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400">檔案上傳（請透過編輯模式上傳）</p>
        </div>
      </div>
    )
  }

  if (field.type === 'repeating_group' && field.fields) {
    return <RepeatingGroupField field={field} values={values} setValue={setValue} companyName={companyName} />
  }

  if (field.type === 'rating') {
    const max = field.max ?? 5
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {field.required && <span className="text-red-400">*</span>}
        </label>
        <div className="flex gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map(n => (
            <button key={n} type="button" onClick={() => setValue(field.id, n)}
              className={`w-8 h-8 rounded text-sm font-medium border transition-colors ${
                (val as number) === n
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
              }`}>
              {n}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Fallback
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="text" value={(val as string) ?? ''} onChange={e => setValue(field.id, e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
    </div>
  )
}

function RepeatingGroupField({ field, values, setValue, companyName }: {
  field: FormFieldDefinition
  values: Record<string, unknown>
  setValue: (id: string, val: unknown) => void
  companyName: string
}) {
  const subFields = field.fields ?? []
  const rows = (values[field.id] as Record<string, unknown>[] | undefined) ?? [{}]
  const maxRows = field.max_rows ?? 50

  function updateRow(rowIdx: number, colId: string, val: unknown) {
    const newRows = [...rows]
    newRows[rowIdx] = { ...newRows[rowIdx], [colId]: val }
    setValue(field.id, newRows)
  }

  function addRow() {
    if (rows.length < maxRows) setValue(field.id, [...rows, {}])
  }

  function removeRow(idx: number) {
    if (rows.length > (field.min_rows ?? 1)) {
      setValue(field.id, rows.filter((_, i) => i !== idx))
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label.replace(/\{\{公司名稱\}\}/g, companyName)}
        {field.required && <span className="text-red-400">*</span>}
      </label>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1.5 text-left text-xs text-gray-500 w-8">#</th>
              {subFields.map(sf => (
                <th key={sf.id} className="px-2 py-1.5 text-left text-xs text-gray-500">{sf.label}</th>
              ))}
              <th className="px-2 py-1.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td className="px-2 py-1.5 text-xs text-gray-400">{ri + 1}</td>
                {subFields.map(sf => (
                  <td key={sf.id} className="px-2 py-1">
                    <input type={sf.type === 'number' ? 'number' : 'text'}
                      value={(row[sf.id] as string) ?? ''}
                      onChange={e => updateRow(ri, sf.id, e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  {rows.length > (field.min_rows ?? 1) && (
                    <button onClick={() => removeRow(ri)}
                      className="text-xs text-red-400 hover:text-red-600">×</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length < maxRows && (
        <button onClick={addRow}
          className="mt-1 text-xs text-indigo-600 hover:text-indigo-700">+ 新增一列</button>
      )}
    </div>
  )
}
