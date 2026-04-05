'use client'

import { useState } from 'react'
import type { FormSchema, FormSection, FormFieldDefinition, PddroFieldType } from '@/types/form-schema'

interface Props {
  schema: FormSchema
  onSave: (schema: FormSchema) => Promise<void>
  companyName?: string
}

const BLOCK_TYPES: { value: PddroFieldType | 'paragraph'; label: string; icon: string }[] = [
  { value: 'paragraph', label: '文字段落', icon: '¶' },
  { value: 'text', label: '單行填寫', icon: '—' },
  { value: 'textarea', label: '多行填寫', icon: '≡' },
  { value: 'number', label: '數字', icon: '#' },
  { value: 'date', label: '日期', icon: 'D' },
  { value: 'radio', label: '單選', icon: '◉' },
  { value: 'checkbox', label: '多選', icon: '☑' },
  { value: 'rating', label: '評分', icon: '★' },
  { value: 'repeating_group', label: '表格', icon: '⊞' },
  { value: 'file_upload', label: '附件上傳', icon: '📎' },
  { value: 'signature', label: '簽核欄', icon: '✍' },
  { value: 'section_header', label: '標題', icon: 'H' },
]

function genId() { return 'b_' + Math.random().toString(36).slice(2, 8) }

export function DocumentEditor({ schema: initial, onSave, companyName }: Props) {
  const [schema, setSchema] = useState<FormSchema>(initial)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [addingAt, setAddingAt] = useState<{ sectionIdx: number; fieldIdx: number } | null>(null)

  // Flatten: 如果只有一個 section 且沒 title，就用它；否則保持
  const sections = schema.sections.length > 0 ? schema.sections : [{ id: 'main', fields: [] }]

  function updateSection(idx: number, section: FormSection) {
    const s = [...schema.sections]; s[idx] = section; setSchema({ ...schema, sections: s })
  }

  function addSection() {
    setSchema({ ...schema, sections: [...schema.sections, { id: genId(), title: '新區段', fields: [] }] })
  }

  function removeSection(idx: number) {
    if (!confirm('刪除此區段？')) return
    setSchema({ ...schema, sections: schema.sections.filter((_, i) => i !== idx) })
  }

  function addBlock(sectionIdx: number, fieldIdx: number, type: string) {
    const s = [...schema.sections]
    const fields = [...s[sectionIdx].fields]

    let newField: FormFieldDefinition

    if (type === 'paragraph') {
      newField = { id: genId(), label: '', type: 'static_text', description: '在此輸入文字內容...' }
    } else if (type === 'section_header') {
      newField = { id: genId(), label: '標題', type: 'section_header' }
    } else if (type === 'signature') {
      newField = { id: genId(), label: '簽核', type: 'signature', signers: ['承辦人', '主管', '總經理'] }
    } else if (type === 'repeating_group') {
      newField = {
        id: genId(), label: '表格', type: 'repeating_group', min_rows: 1, max_rows: 20,
        fields: [
          { id: genId(), label: '欄位1', type: 'text' },
          { id: genId(), label: '欄位2', type: 'text' },
        ]
      }
    } else {
      newField = { id: genId(), label: '欄位名稱', type: type as PddroFieldType }
    }

    fields.splice(fieldIdx, 0, newField)
    s[sectionIdx] = { ...s[sectionIdx], fields }
    setSchema({ ...schema, sections: s })
    setAddingAt(null)
  }

  function updateField(sectionIdx: number, fieldIdx: number, field: FormFieldDefinition) {
    const s = [...schema.sections]
    const fields = [...s[sectionIdx].fields]
    fields[fieldIdx] = field
    s[sectionIdx] = { ...s[sectionIdx], fields }
    setSchema({ ...schema, sections: s })
  }

  function removeField(sectionIdx: number, fieldIdx: number) {
    const s = [...schema.sections]
    s[sectionIdx] = { ...s[sectionIdx], fields: s[sectionIdx].fields.filter((_, i) => i !== fieldIdx) }
    setSchema({ ...schema, sections: s })
  }

  function moveField(sectionIdx: number, from: number, to: number) {
    if (to < 0 || to >= schema.sections[sectionIdx].fields.length) return
    const s = [...schema.sections]
    const fields = [...s[sectionIdx].fields]
    const [moved] = fields.splice(from, 1)
    fields.splice(to, 0, moved)
    s[sectionIdx] = { ...s[sectionIdx], fields }
    setSchema({ ...schema, sections: s })
  }

  async function handleSave() {
    setSaving(true)
    await onSave(schema)
    setSaving(false)
  }

  const replaceVars = (t: string) => companyName ? t.replace(/\{company_name\}/g, companyName).replace(/\{\{公司名稱\}\}/g, companyName) : t

  // ===== 預覽模式 =====
  if (preview) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">文件預覽</h3>
          <button onClick={() => setPreview(false)} className="text-sm text-indigo-600 hover:text-indigo-700">返回編輯</button>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-[700px] mx-auto" style={{ fontFamily: "'Microsoft JhengHei', sans-serif" }}>
          <h1 className="text-xl font-bold text-center mb-6 border-b-2 border-gray-800 pb-3">{replaceVars(schema.title)}</h1>
          {schema.sections.map(section => (
            <div key={section.id} className="mb-6">
              {section.title && <h2 className="text-base font-bold border-b border-gray-300 pb-1 mb-3">{section.title}</h2>}
              {section.fields.map(field => (
                <PreviewBlock key={field.id} field={field} />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ===== 編輯模式 =====
  return (
    <div className="space-y-4">
      {/* 標題 */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-500">文件標題</label>
          <input value={schema.title} onChange={e => setSchema({ ...schema, title: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div className="w-40">
          <label className="text-xs text-gray-500">表號</label>
          <input value={schema.subtitle ?? ''} onChange={e => setSchema({ ...schema, subtitle: e.target.value || undefined })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
      </div>

      {/* 區段 */}
      {schema.sections.map((section, si) => (
        <div key={section.id} className="border border-gray-200 rounded-xl bg-white">
          {/* 區段標題 */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-t-xl border-b border-gray-200">
            <input value={section.title ?? ''} onChange={e => updateSection(si, { ...section, title: e.target.value || undefined })}
              placeholder="區段標題（選填）" className="flex-1 text-sm font-medium bg-transparent border-0 focus:outline-none" />
            <span className="text-xs text-gray-400">{section.fields.length} 項</span>
            <button onClick={() => removeSection(si)} className="text-xs text-gray-300 hover:text-red-500">刪除</button>
          </div>

          {/* 內容區塊 */}
          <div className="p-3 space-y-1">
            {/* 頂部插入點 */}
            <InsertPoint active={addingAt?.sectionIdx === si && addingAt?.fieldIdx === 0}
              onActivate={() => setAddingAt({ sectionIdx: si, fieldIdx: 0 })}
              onSelect={(type) => addBlock(si, 0, type)}
              onCancel={() => setAddingAt(null)} />

            {section.fields.map((field, fi) => (
              <div key={field.id}>
                <BlockEditor
                  field={field}
                  onChange={(f) => updateField(si, fi, f)}
                  onRemove={() => removeField(si, fi)}
                  onMoveUp={() => moveField(si, fi, fi - 1)}
                  onMoveDown={() => moveField(si, fi, fi + 1)}
                  isFirst={fi === 0}
                  isLast={fi === section.fields.length - 1}
                />
                {/* 每個 block 下方的插入點 */}
                <InsertPoint active={addingAt?.sectionIdx === si && addingAt?.fieldIdx === fi + 1}
                  onActivate={() => setAddingAt({ sectionIdx: si, fieldIdx: fi + 1 })}
                  onSelect={(type) => addBlock(si, fi + 1, type)}
                  onCancel={() => setAddingAt(null)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={addSection}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors">
        + 新增區段
      </button>

      {/* 操作列 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <button onClick={() => setPreview(true)} className="text-sm text-gray-600 hover:text-indigo-600 border border-gray-200 rounded-lg px-4 py-2">
          預覽文件
        </button>
        <button onClick={handleSave} disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? '儲存中...' : '儲存'}
        </button>
      </div>
    </div>
  )
}

// ===== 插入點 =====
function InsertPoint({ active, onActivate, onSelect, onCancel }: {
  active: boolean; onActivate: () => void; onSelect: (type: string) => void; onCancel: () => void
}) {
  if (active) {
    return (
      <div className="py-1">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2">
          <div className="flex flex-wrap gap-1">
            {BLOCK_TYPES.map(bt => (
              <button key={bt.value} onClick={() => onSelect(bt.value)}
                className="text-xs bg-white border border-gray-200 rounded px-2 py-1 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center gap-1">
                <span className="text-[10px] opacity-60">{bt.icon}</span>
                {bt.label}
              </button>
            ))}
          </div>
          <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 mt-1">取消</button>
        </div>
      </div>
    )
  }
  return (
    <div className="py-0.5 group">
      <button onClick={onActivate}
        className="w-full h-0.5 rounded opacity-0 group-hover:opacity-100 bg-indigo-200 hover:bg-indigo-400 transition-all relative">
        <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 text-[10px] text-indigo-400 bg-white px-2 rounded">+ 插入</span>
      </button>
    </div>
  )
}

// ===== Block 編輯器 =====
function BlockEditor({ field, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: {
  field: FormFieldDefinition; onChange: (f: FormFieldDefinition) => void; onRemove: () => void
  onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  // 文字段落
  if (field.type === 'static_text') {
    return (
      <div className="group relative rounded-lg border border-transparent hover:border-gray-200 px-3 py-2">
        <textarea
          value={field.description ?? ''}
          onChange={e => onChange({ ...field, description: e.target.value })}
          placeholder="輸入文字內容..."
          rows={Math.max(2, (field.description ?? '').split('\n').length)}
          className="w-full text-sm text-gray-700 bg-transparent border-0 resize-none focus:outline-none leading-relaxed"
        />
        <BlockActions onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={isFirst} isLast={isLast} label="文字段落" />
      </div>
    )
  }

  // 標題
  if (field.type === 'section_header') {
    return (
      <div className="group relative rounded-lg border border-transparent hover:border-gray-200 px-3 py-2">
        <input value={field.label} onChange={e => onChange({ ...field, label: e.target.value })}
          className="w-full text-base font-bold text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 focus:outline-none focus:border-indigo-500 pb-1" />
        <BlockActions onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={isFirst} isLast={isLast} label="標題" />
      </div>
    )
  }

  // 簽名欄
  if (field.type === 'signature') {
    return (
      <div className="group relative rounded-lg border border-gray-200 px-3 py-2 bg-gray-50/50">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-400">✍ 簽核欄</span>
        </div>
        <input value={(field.signers ?? []).join(', ')} onChange={e => onChange({ ...field, signers: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="簽核人（逗號分隔，如：承辦人, 主管, 總經理）"
          className="w-full text-sm bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <BlockActions onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={isFirst} isLast={isLast} label="簽核" />
      </div>
    )
  }

  // 表格（repeating_group）
  if (field.type === 'repeating_group') {
    return (
      <div className="group relative rounded-lg border border-gray-200 px-3 py-2 bg-gray-50/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400">⊞ 表格</span>
          <input value={field.label} onChange={e => onChange({ ...field, label: e.target.value })}
            className="flex-1 text-sm font-medium bg-transparent border-0 focus:outline-none" placeholder="表格名稱" />
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {(field.fields ?? []).map((sub, i) => (
            <div key={i} className="flex items-center gap-1 bg-white border border-gray-200 rounded px-2 py-0.5">
              <input value={sub.label} onChange={e => {
                const f = [...(field.fields ?? [])]; f[i] = { ...f[i], label: e.target.value }
                onChange({ ...field, fields: f })
              }} className="text-xs bg-transparent border-0 w-16 focus:outline-none" />
              <button onClick={() => onChange({ ...field, fields: (field.fields ?? []).filter((_, j) => j !== i) })}
                className="text-[10px] text-gray-300 hover:text-red-500">×</button>
            </div>
          ))}
          <button onClick={() => onChange({ ...field, fields: [...(field.fields ?? []), { id: genId(), label: '新欄位', type: 'text' }] })}
            className="text-xs text-indigo-500 hover:text-indigo-700 px-1">+欄</button>
        </div>
        <BlockActions onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={isFirst} isLast={isLast} label="表格" />
      </div>
    )
  }

  // 一般表單欄位（text, textarea, number, date, radio, checkbox, rating, file_upload）
  const typeLabel = BLOCK_TYPES.find(b => b.value === field.type)?.label ?? field.type
  const hasOptions = field.type === 'radio' || field.type === 'checkbox'

  return (
    <div className="group relative rounded-lg border border-gray-200 px-3 py-2 bg-gray-50/50">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-14 flex-shrink-0">{typeLabel}</span>
        <input value={field.label} onChange={e => onChange({ ...field, label: e.target.value })}
          className="flex-1 text-sm bg-transparent border-0 focus:outline-none" placeholder="欄位名稱" />
        <label className="flex items-center gap-1 text-xs text-gray-400">
          <input type="checkbox" checked={field.required ?? false} onChange={e => onChange({ ...field, required: e.target.checked })}
            className="rounded text-indigo-600 w-3 h-3" />
          必填
        </label>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-gray-400 hover:text-gray-600">
          {expanded ? '收起' : '展開'}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 space-y-2">
          {field.description !== undefined && (
            <input value={field.description ?? ''} onChange={e => onChange({ ...field, description: e.target.value || undefined })}
              placeholder="說明文字" className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          )}
          {hasOptions && (
            <div>
              <p className="text-xs text-gray-400 mb-1">選項</p>
              {(field.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-1 mb-0.5">
                  <input value={opt.label} onChange={e => {
                    const o = [...(field.options ?? [])]; o[i] = { ...o[i], label: e.target.value, value: e.target.value.toLowerCase().replace(/\s/g, '_') }
                    onChange({ ...field, options: o })
                  }} placeholder="選項文字" className="flex-1 text-xs border border-gray-300 rounded px-2 py-0.5" />
                  <button onClick={() => onChange({ ...field, options: (field.options ?? []).filter((_, j) => j !== i) })}
                    className="text-[10px] text-red-400">×</button>
                </div>
              ))}
              <button onClick={() => onChange({ ...field, options: [...(field.options ?? []), { label: '', value: '' }] })}
                className="text-xs text-indigo-500">+ 新增選項</button>
            </div>
          )}
        </div>
      )}

      <BlockActions onRemove={onRemove} onMoveUp={onMoveUp} onMoveDown={onMoveDown} isFirst={isFirst} isLast={isLast} label={typeLabel} />
    </div>
  )
}

// ===== Block 操作按鈕 =====
function BlockActions({ onRemove, onMoveUp, onMoveDown, isFirst, isLast, label }: {
  onRemove: () => void; onMoveUp: () => void; onMoveDown: () => void
  isFirst: boolean; isLast: boolean; label: string
}) {
  return (
    <div className="absolute right-1 top-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded shadow-sm border border-gray-200 px-1">
      {!isFirst && <button onClick={onMoveUp} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5">↑</button>}
      {!isLast && <button onClick={onMoveDown} className="text-[10px] text-gray-400 hover:text-gray-700 px-0.5">↓</button>}
      <button onClick={onRemove} className="text-[10px] text-gray-400 hover:text-red-500 px-0.5">✕</button>
    </div>
  )
}

// ===== 預覽 Block =====
function PreviewBlock({ field }: { field: FormFieldDefinition }) {
  if (field.type === 'static_text') {
    return <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed my-1">{field.description}</p>
  }
  if (field.type === 'section_header') {
    return <h3 className="text-sm font-bold text-gray-900 mt-3 mb-1">{field.label}</h3>
  }
  if (field.type === 'signature') {
    return (
      <div className="flex gap-8 mt-4 pt-3 border-t border-gray-200">
        {(field.signers ?? []).map(s => (
          <div key={s} className="text-center">
            <div className="w-24 h-10 border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-500">{s}</p>
          </div>
        ))}
      </div>
    )
  }
  if (field.type === 'repeating_group') {
    return (
      <div className="my-2">
        <table className="w-full text-xs border-collapse border border-gray-300">
          <thead><tr className="bg-gray-100">
            {(field.fields ?? []).map(f => <th key={f.id} className="border border-gray-300 px-2 py-1 text-left">{f.label}</th>)}
          </tr></thead>
          <tbody>{[1, 2, 3].map(r => (
            <tr key={r}>{(field.fields ?? []).map(f => <td key={f.id} className="border border-gray-300 px-2 py-2">&nbsp;</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
    )
  }
  if (field.type === 'radio' || field.type === 'checkbox') {
    return (
      <div className="flex items-center gap-2 py-0.5">
        <span className="text-sm text-gray-700">{field.label}：</span>
        {(field.options ?? []).map(o => <span key={o.value} className="text-sm text-gray-600">□ {o.label}　</span>)}
      </div>
    )
  }
  if (field.type === 'file_upload') {
    return <div className="py-0.5"><span className="text-sm text-gray-700">{field.label}：</span><span className="text-xs text-gray-400">（附件）</span></div>
  }
  if (field.type === 'textarea') {
    return (
      <div className="py-0.5">
        <p className="text-sm text-gray-700">{field.label}：</p>
        <div className="border border-gray-300 rounded min-h-[40px] mt-1" />
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-sm text-gray-700">{field.label}：</span>
      <span className="flex-1 border-b border-gray-300">&nbsp;</span>
    </div>
  )
}
