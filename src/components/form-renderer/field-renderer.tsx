'use client'

import type { FormFieldDefinition, FormResponseData } from '@/types/form-schema'
import { TextField } from './fields/text-field'
import { NumberField } from './fields/number-field'
import { DateField } from './fields/date-field'
import { RadioField } from './fields/radio-field'
import { CheckboxField } from './fields/checkbox-field'
import { SelectField } from './fields/select-field'
import { RatingField } from './fields/rating-field'
import { FileUploadField } from './fields/file-upload-field'
import { SignatureField } from './fields/signature-field'
import { StaticTextField } from './fields/static-text-field'
import { RepeatingGroupField } from './fields/repeating-group-field'

interface FieldRendererProps {
  field: FormFieldDefinition
  value: unknown
  onChange: (value: unknown) => void
  disabled?: boolean
  /** 整份表單目前的資料，用於條件判斷 */
  formData?: FormResponseData
  companyName?: string
}

/** 檢查欄位條件是否滿足 */
function checkCondition(field: FormFieldDefinition, formData?: FormResponseData): boolean {
  if (!field.condition || !formData) return true
  const { field_id, operator, value: condValue } = field.condition
  const currentValue = formData[field_id]

  switch (operator) {
    case 'eq':
      return currentValue === condValue
    case 'neq':
      return currentValue !== condValue
    case 'in':
      return Array.isArray(currentValue) && currentValue.includes(condValue as string)
    default:
      return true
  }
}

export function FieldRenderer({ field, value, onChange, disabled, formData, companyName }: FieldRendererProps) {
  // 條件不滿足則不顯示
  if (!checkCondition(field, formData)) return null

  // static_text 不需要值
  if (field.type === 'static_text') {
    return <StaticTextField field={field} />
  }

  // section_header 只顯示標題
  if (field.type === 'section_header') {
    return (
      <div className="pt-2">
        <h4 className="text-sm font-semibold text-gray-800">{field.label}</h4>
        {field.description && <p className="text-xs text-gray-400 mt-0.5">{field.description}</p>}
      </div>
    )
  }

  const label = companyName ? field.label.replace(/\{company_name\}/g, companyName) : field.label

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {field.description && field.type !== 'file_upload' && (
        <p className="text-xs text-gray-400 mb-1.5">{field.description}</p>
      )}

      {(field.type === 'text' || field.type === 'textarea') && (
        <TextField field={field} value={value as string} onChange={onChange as (v: string) => void} disabled={disabled} />
      )}
      {field.type === 'number' && (
        <NumberField field={field} value={value as number | string} onChange={onChange as (v: number | string) => void} disabled={disabled} />
      )}
      {(field.type === 'date' || field.type === 'time') && (
        <DateField field={field} value={value as string} onChange={onChange as (v: string) => void} disabled={disabled} />
      )}
      {field.type === 'radio' && (
        <RadioField field={field} value={value as string} onChange={onChange as (v: string) => void} disabled={disabled} />
      )}
      {field.type === 'checkbox' && (
        <CheckboxField field={field} value={value as string[]} onChange={onChange as (v: string[]) => void} disabled={disabled} />
      )}
      {field.type === 'select' && (
        <SelectField field={field} value={value as string} onChange={onChange as (v: string) => void} disabled={disabled} />
      )}
      {field.type === 'rating' && (
        <RatingField field={field} value={value as number | string} onChange={onChange as (v: number) => void} disabled={disabled} />
      )}
      {field.type === 'file_upload' && (
        <FileUploadField field={field} value={value as string} onChange={onChange as (v: string) => void} disabled={disabled} />
      )}
      {field.type === 'signature' && (
        <SignatureField field={field} value={value as Record<string, { name: string; date: string }>} onChange={onChange} disabled={disabled} />
      )}
      {field.type === 'repeating_group' && (
        <RepeatingGroupField
          field={field}
          value={value as FormResponseData[]}
          onChange={onChange as (v: FormResponseData[]) => void}
          disabled={disabled}
          companyName={companyName}
        />
      )}
    </div>
  )
}
