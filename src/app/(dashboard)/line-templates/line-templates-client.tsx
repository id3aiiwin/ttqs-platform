'use client'

import { useState, useRef } from 'react'
import type { LineMessageTemplate, LineSendLog } from '@/types/database'

type Category = 'instructor' | 'student' | 'client'

const CATEGORY_CONFIG: Record<Category, { label: string; color: string; bgColor: string }> = {
  instructor: { label: '講師通知', color: 'text-green-700', bgColor: 'bg-green-50' },
  student: { label: '學員通知', color: 'text-blue-700', bgColor: 'bg-blue-50' },
  client: { label: '客戶通知', color: 'text-amber-700', bgColor: 'bg-amber-50' },
}

const CATEGORY_VARIABLES: Record<Category, string[]> = {
  instructor: ['課程名稱', '開課日期', '課程時數', '講師姓名', '企業名稱', '問卷連結'],
  student: ['課程名稱', '開課日期', '課程時數', '講師姓名', '問卷連結', '異動內容'],
  client: ['聯繫人姓名', '企業名稱', '課程名稱', '開課日期', '講師姓名', '合約到期日', '評量日期', '評量人數', '年度', '課程數量'],
}

const SAMPLE_VALUES: Record<string, string> = {
  '課程名稱': '溝通技巧工作坊',
  '開課日期': '2026/05/01',
  '課程時數': '6',
  '講師姓名': '王大明',
  '企業名稱': '範例科技公司',
  '問卷連結': 'https://example.com/survey/abc',
  '聯繫人姓名': '李經理',
  '合約到期日': '2026/12/31',
  '評量日期': '2026/06/15',
  '評量人數': '20',
  '年度': '2026',
  '課程數量': '12',
  '異動內容': '上課日期改為 5/15',
}

interface Props {
  initialTemplates: LineMessageTemplate[]
  initialLogs: LineSendLog[]
}

export function LineTemplatesClient({ initialTemplates, initialLogs }: Props) {
  const [tab, setTab] = useState<'templates' | 'logs'>('templates')
  const [templates, setTemplates] = useState(initialTemplates)
  const [logs] = useState(initialLogs)
  const [editingTemplate, setEditingTemplate] = useState<Partial<LineMessageTemplate> & { isNew?: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)

  const grouped = {
    instructor: templates.filter(t => t.category === 'instructor'),
    student: templates.filter(t => t.category === 'student'),
    client: templates.filter(t => t.category === 'client'),
  }

  function insertVariable(variable: string) {
    const ta = contentRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = editingTemplate?.content || ''
    const insert = `{{${variable}}}`
    const newContent = text.substring(0, start) + insert + text.substring(end)
    setEditingTemplate(prev => prev ? { ...prev, content: newContent } : null)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + insert.length
    }, 0)
  }

  function previewContent(content: string) {
    let result = content
    for (const [key, val] of Object.entries(SAMPLE_VALUES)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val)
    }
    return result
  }

  async function handleSave() {
    if (!editingTemplate) return
    setSaving(true)
    try {
      if (editingTemplate.isNew) {
        const res = await fetch('/api/line-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: editingTemplate.category,
            name: editingTemplate.name,
            content: editingTemplate.content,
            description: editingTemplate.description,
            variables: editingTemplate.variables,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          setTemplates(prev => [...prev, data])
          setEditingTemplate(null)
        } else {
          alert(data.error)
        }
      } else {
        const res = await fetch('/api/line-templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTemplate.id,
            name: editingTemplate.name,
            content: editingTemplate.content,
            description: editingTemplate.description,
            variables: editingTemplate.variables,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          setTemplates(prev => prev.map(t => t.id === data.id ? data : t))
          setEditingTemplate(null)
        } else {
          alert(data.error)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除此模板？')) return
    const res = await fetch('/api/line-templates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    if (res.ok) {
      setTemplates(prev => prev.filter(t => t.id !== id))
    } else {
      alert(data.error)
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setTab('templates')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === 'templates' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
          模板管理
        </button>
        <button onClick={() => setTab('logs')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${tab === 'logs' ? 'bg-white text-gray-900 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
          發送紀錄
        </button>
      </div>

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="space-y-8">
          {(['instructor', 'student', 'client'] as Category[]).map(cat => {
            const cfg = CATEGORY_CONFIG[cat]
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-lg font-semibold ${cfg.color}`}>{cfg.label}</h2>
                  <button
                    onClick={() => setEditingTemplate({ category: cat, name: '', content: '', description: '', variables: [], isNew: true })}
                    className="text-xs text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg px-3 py-1.5">
                    + 新增模板
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[cat].map(tmpl => (
                    <div key={tmpl.id} className={`${cfg.bgColor} border rounded-xl p-4 space-y-2`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{tmpl.name}</h3>
                          {tmpl.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{tmpl.description}</p>
                          )}
                        </div>
                        {tmpl.is_default && (
                          <span className="text-[10px] bg-white/70 text-gray-500 px-1.5 py-0.5 rounded">預設</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(tmpl.variables || []).map(v => (
                          <span key={v} className="text-[10px] bg-white/80 text-gray-600 px-1.5 py-0.5 rounded">
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setEditingTemplate({ ...tmpl })}
                          className="text-xs text-indigo-600 hover:text-indigo-700">
                          編輯
                        </button>
                        {!tmpl.is_default && (
                          <button onClick={() => handleDelete(tmpl.id)}
                            className="text-xs text-red-500 hover:text-red-600">
                            刪除
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Logs Tab */}
      {tab === 'logs' && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">時間</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">分類</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">對象</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">發送數/失敗數</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">發送者</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">尚無發送紀錄</td></tr>
              ) : logs.map(log => {
                const catCfg = CATEGORY_CONFIG[log.category as Category]
                const badgeColors = {
                  instructor: 'bg-green-100 text-green-700',
                  student: 'bg-blue-100 text-blue-700',
                  client: 'bg-amber-100 text-amber-700',
                }
                return (
                  <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${badgeColors[log.category as Category] || 'bg-gray-100 text-gray-700'}`}>
                        {catCfg?.label || log.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">{log.recipient_name || '-'}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="text-green-600">{log.recipient_count}</span>
                      {log.failed_count > 0 && <span className="text-red-500 ml-1">/ {log.failed_count}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{log.sent_by_name || '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {/* Expanded log content */}
          {expandedLog && (() => {
            const log = logs.find(l => l.id === expandedLog)
            if (!log) return null
            return (
              <div className="border-t bg-gray-50 px-6 py-4">
                <p className="text-xs text-gray-500 mb-2">訊息內容</p>
                <div className="bg-white rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border max-h-48 overflow-y-auto">
                  {log.message_content}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditingTemplate(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTemplate.isNew ? '新增模板' : '編輯模板'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700">模板名稱</label>
                <input type="text" value={editingTemplate.name || ''}
                  onChange={e => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-700">描述</label>
                <input type="text" value={editingTemplate.description || ''}
                  onChange={e => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              {/* Content */}
              <div>
                <label className="text-sm font-medium text-gray-700">訊息內容</label>
                <textarea ref={contentRef} value={editingTemplate.content || ''} rows={8}
                  onChange={e => setEditingTemplate(prev => prev ? { ...prev, content: e.target.value } : null)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" />
              </div>
              {/* Variable helper */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">點擊插入變數</label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_VARIABLES[editingTemplate.category as Category]?.map(v => (
                    <button key={v} onClick={() => insertVariable(v)}
                      className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors">
                      {`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
              {/* Variables tags */}
              <div>
                <label className="text-sm font-medium text-gray-700">已使用變數</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(() => {
                    const matches = (editingTemplate.content || '').match(/\{\{([^}]+)\}\}/g)
                    const vars = [...new Set((matches || []).map(m => m.replace(/[{}]/g, '')))]
                    // Auto-update variables on the editing template
                    if (JSON.stringify(vars) !== JSON.stringify(editingTemplate.variables || [])) {
                      setTimeout(() => setEditingTemplate(prev => prev ? { ...prev, variables: vars } : null), 0)
                    }
                    return vars.map(v => (
                      <span key={v} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{v}</span>
                    ))
                  })()}
                </div>
              </div>
              {/* Preview */}
              <div>
                <label className="text-sm font-medium text-gray-700">預覽（範例值）</label>
                <div className="mt-1 bg-green-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border border-green-100 max-h-48 overflow-y-auto">
                  {previewContent(editingTemplate.content || '')}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
                取消
              </button>
              <button onClick={handleSave} disabled={saving || !editingTemplate.name || !editingTemplate.content}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {saving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
