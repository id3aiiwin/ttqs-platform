'use client'

import type { FormFieldOption } from '@/types/form-schema'

interface Props {
  options: FormFieldOption[]
  onChange: (options: FormFieldOption[]) => void
}

export function OptionsEditor({ options, onChange }: Props) {
  function addOption() {
    onChange([...options, { label: '', value: '' }])
  }

  function removeOption(index: number) {
    onChange(options.filter((_, i) => i !== index))
  }

  function updateOption(index: number, key: 'label' | 'value', val: string) {
    const updated = [...options]
    updated[index] = { ...updated[index], [key]: val }
    // 自動從 label 產生 value
    if (key === 'label' && !updated[index].value) {
      updated[index].value = val.toLowerCase().replace(/[^a-z0-9]/g, '_')
    }
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-medium">選項</p>
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={opt.label}
            onChange={(e) => updateOption(i, 'label', e.target.value)}
            placeholder="顯示文字"
            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={opt.value}
            onChange={(e) => updateOption(i, 'value', e.target.value)}
            placeholder="值"
            className="w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button type="button" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600 text-sm">
            x
          </button>
        </div>
      ))}
      <button type="button" onClick={addOption} className="text-xs text-indigo-600 hover:text-indigo-700">
        + 新增選項
      </button>
    </div>
  )
}
