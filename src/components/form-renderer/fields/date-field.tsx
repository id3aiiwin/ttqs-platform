'use client'

import type { FormFieldDefinition } from '@/types/form-schema'

interface Props {
  field: FormFieldDefinition
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function DateField({ field, value, onChange, disabled }: Props) {
  return (
    <input
      type={field.type === 'time' ? 'time' : 'date'}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
      disabled={disabled}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
    />
  )
}
