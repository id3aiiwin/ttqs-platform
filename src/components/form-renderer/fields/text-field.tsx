'use client'

import type { FormFieldDefinition } from '@/types/form-schema'

interface Props {
  field: FormFieldDefinition
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TextField({ field, value, onChange, disabled }: Props) {
  if (field.type === 'textarea') {
    return (
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
        disabled={disabled}
        rows={4}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
      />
    )
  }

  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      required={field.required}
      disabled={disabled}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
    />
  )
}
