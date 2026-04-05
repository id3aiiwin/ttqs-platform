'use client'

import type { FormFieldDefinition } from '@/types/form-schema'

interface Props {
  field: FormFieldDefinition
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function RadioField({ field, value, onChange, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-4">
      {field.options?.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="radio"
            name={field.id}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            disabled={disabled}
            className="text-indigo-600 focus:ring-indigo-500"
          />
          <span className={disabled ? 'text-gray-500' : 'text-gray-700'}>{opt.label}</span>
        </label>
      ))}
    </div>
  )
}
