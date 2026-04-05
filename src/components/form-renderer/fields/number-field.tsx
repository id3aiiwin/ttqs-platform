'use client'

import type { FormFieldDefinition } from '@/types/form-schema'

interface Props {
  field: FormFieldDefinition
  value: number | string
  onChange: (value: number | string) => void
  disabled?: boolean
}

export function NumberField({ field, value, onChange, disabled }: Props) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      min={field.min}
      max={field.max}
      placeholder={field.placeholder}
      required={field.required}
      disabled={disabled}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
    />
  )
}
