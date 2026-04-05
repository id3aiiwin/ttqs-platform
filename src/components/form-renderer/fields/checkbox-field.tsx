'use client'

import type { FormFieldDefinition } from '@/types/form-schema'

interface Props {
  field: FormFieldDefinition
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function CheckboxField({ field, value, onChange, disabled }: Props) {
  const selected = Array.isArray(value) ? value : []

  function toggle(optValue: string) {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue))
    } else {
      onChange([...selected, optValue])
    }
  }

  return (
    <div className="flex flex-wrap gap-4">
      {field.options?.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            disabled={disabled}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <span className={disabled ? 'text-gray-500' : 'text-gray-700'}>{opt.label}</span>
        </label>
      ))}
    </div>
  )
}
