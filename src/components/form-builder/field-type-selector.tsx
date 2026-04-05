'use client'

import type { PddroFieldType } from '@/types/form-schema'

const FIELD_TYPES: { value: PddroFieldType; label: string; icon: string }[] = [
  { value: 'text', label: '單行文字', icon: 'T' },
  { value: 'textarea', label: '多行文字', icon: '=' },
  { value: 'number', label: '數字', icon: '#' },
  { value: 'date', label: '日期', icon: 'D' },
  { value: 'time', label: '時間', icon: 'T' },
  { value: 'radio', label: '單選', icon: 'O' },
  { value: 'checkbox', label: '多選', icon: 'V' },
  { value: 'select', label: '下拉選單', icon: 'v' },
  { value: 'rating', label: '評分', icon: '*' },
  { value: 'repeating_group', label: '重複群組', icon: '+' },
  { value: 'file_upload', label: '檔案上傳', icon: 'F' },
  { value: 'signature', label: '簽核', icon: 'S' },
  { value: 'static_text', label: '靜態文字', icon: 'i' },
  { value: 'section_header', label: '區段標題', icon: 'H' },
]

interface Props {
  value: PddroFieldType
  onChange: (type: PddroFieldType) => void
}

export function FieldTypeSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as PddroFieldType)}
      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      {FIELD_TYPES.map((ft) => (
        <option key={ft.value} value={ft.value}>
          {ft.icon} {ft.label}
        </option>
      ))}
    </select>
  )
}
