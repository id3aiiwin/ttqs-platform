'use client'

import type { FormFieldDefinition, FormResponseData } from '@/types/form-schema'
import { FieldRenderer } from '../field-renderer'

interface Props {
  field: FormFieldDefinition
  value: FormResponseData[]
  onChange: (value: FormResponseData[]) => void
  disabled?: boolean
  companyName?: string
}

export function RepeatingGroupField({ field, value, onChange, disabled, companyName }: Props) {
  const rows = Array.isArray(value) ? value : []
  const childFields = field.fields ?? []
  const minRows = field.min_rows ?? 0
  const maxRows = field.max_rows ?? 50

  function addRow() {
    if (rows.length >= maxRows) return
    const emptyRow: FormResponseData = {}
    childFields.forEach((f) => {
      emptyRow[f.id] = f.type === 'checkbox' ? [] : ''
    })
    onChange([...rows, emptyRow])
  }

  function removeRow(index: number) {
    if (rows.length <= minRows) return
    onChange(rows.filter((_, i) => i !== index))
  }

  function updateRow(index: number, fieldId: string, fieldValue: unknown) {
    const updated = [...rows]
    updated[index] = { ...updated[index], [fieldId]: fieldValue }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="relative border border-gray-200 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-400">#{rowIdx + 1}</span>
            {!disabled && rows.length > minRows && (
              <button
                type="button"
                onClick={() => removeRow(rowIdx)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                移除
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {childFields.map((childField) => (
              <div key={childField.id} className={childField.columns === 1 ? 'md:col-span-1' : 'md:col-span-2'}>
                <FieldRenderer
                  field={childField}
                  value={row[childField.id]}
                  onChange={(val) => updateRow(rowIdx, childField.id, val)}
                  disabled={disabled}
                  formData={row}
                  companyName={companyName}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {!disabled && rows.length < maxRows && (
        <button
          type="button"
          onClick={addRow}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
        >
          + 新增一列
        </button>
      )}
    </div>
  )
}
