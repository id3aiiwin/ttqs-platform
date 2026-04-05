'use client'

import type { FormFieldDefinition } from '@/types/form-schema'

interface Props {
  field: FormFieldDefinition
  value: number | string
  onChange: (value: number) => void
  disabled?: boolean
}

export function RatingField({ field, value, onChange, disabled }: Props) {
  const min = field.min ?? 1
  const max = field.max ?? 10
  const current = typeof value === 'number' ? value : 0

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => !disabled && onChange(n)}
            disabled={disabled}
            className={`w-8 h-8 rounded text-sm font-medium transition-colors
              ${current === n
                ? 'bg-indigo-600 text-white'
                : current > 0 && n <= current
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
              disabled:cursor-not-allowed`}
          >
            {n}
          </button>
        ))}
      </div>
      {current > 0 && (
        <span className="text-sm text-gray-500 ml-2">{current} 分</span>
      )}
    </div>
  )
}
