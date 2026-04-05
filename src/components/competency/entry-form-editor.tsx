'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateFieldValue, updateEntryStatus } from '@/app/(dashboard)/companies/[id]/competency/actions'
import { Button } from '@/components/ui/button'

interface TemplateField {
  id: string
  field_name: string
  standard_name: string | null
  display_name: string | null
  field_type: string
  is_required: boolean
  options: Record<string, unknown> | null
  sort_order: number
}

interface EntryFormEditorProps {
  entryId: string
  companyId: string
  fields: TemplateField[]
  valuesMap: Record<string, { valueId: string; value: unknown }>
  readOnly: boolean
}

export function EntryFormEditor({ entryId, companyId, fields, valuesMap, readOnly }: EntryFormEditorProps) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    startTransition(async () => {
      await updateEntryStatus(entryId, 'submitted', companyId)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {fields.map((field) => {
        const entry = valuesMap[field.id]
        return (
          <FieldInput
            key={field.id}
            field={field}
            valueId={entry?.valueId}
            initialValue={entry?.value}
            companyId={companyId}
            readOnly={readOnly}
          />
        )
      })}

      {!readOnly && (
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button variant="primary" loading={pending} onClick={handleSubmit}>
            送出審閱
          </Button>
        </div>
      )}
    </div>
  )
}

function FieldInput({
  field,
  valueId,
  initialValue,
  companyId,
  readOnly,
}: {
  field: TemplateField
  valueId?: string
  initialValue?: unknown
  companyId: string
  readOnly: boolean
}) {
  const rawVal = initialValue != null && typeof initialValue === 'object' && 'v' in (initialValue as Record<string, unknown>)
    ? (initialValue as Record<string, unknown>).v as string
    : ''
  const [value, setValue] = useState(rawVal)
  const [saved, setSaved] = useState(true)
  const [pending, startTransition] = useTransition()

  const label = field.display_name || field.standard_name || field.field_name
  const isRating = field.field_type === 'rating'
  const options = field.options as { min?: number; max?: number; labels?: string[] } | null

  function handleBlur() {
    if (!valueId || saved || readOnly) return
    startTransition(async () => {
      await updateFieldValue(valueId, { v: value }, companyId)
      setSaved(true)
    })
  }

  function handleRatingChange(rating: number) {
    if (!valueId || readOnly) return
    setValue(String(rating))
    setSaved(false)
    startTransition(async () => {
      await updateFieldValue(valueId, { v: String(rating) }, companyId)
      setSaved(true)
    })
  }

  if (isRating && options) {
    const max = options.max ?? 5
    const labels = options.labels ?? []
    const currentRating = parseInt(value) || 0

    return (
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">
          {label} {field.is_required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => handleRatingChange(n)}
              disabled={readOnly || pending}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${
                currentRating === n
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-500'
              } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className="text-lg font-bold">L{n}</span>
              {labels[n - 1] && (
                <span className="text-xs">{labels[n - 1].replace(`L${n} `, '')}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const isTextarea = field.field_type === 'textarea'

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">
        {label} {field.is_required && <span className="text-red-500">*</span>}
      </label>
      {field.standard_name && field.display_name && field.display_name !== field.standard_name && (
        <p className="text-xs text-gray-400 mb-1">公版：{field.standard_name}</p>
      )}
      {isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false) }}
          onBlur={handleBlur}
          readOnly={readOnly}
          rows={4}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 resize-y disabled:bg-gray-50"
          placeholder={field.standard_name || ''}
        />
      ) : (
        <input
          type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false) }}
          onBlur={handleBlur}
          readOnly={readOnly}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 disabled:bg-gray-50"
          placeholder={field.standard_name || ''}
        />
      )}
      {!saved && !pending && (
        <p className="text-xs text-amber-500 mt-0.5">未儲存</p>
      )}
    </div>
  )
}
