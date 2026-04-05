'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const CONTACT_TYPES: Record<string, { label: string; color: string }> = {
  phone: { label: '電話', color: 'bg-blue-100 text-blue-700' },
  email: { label: 'Email', color: 'bg-green-100 text-green-700' },
  line: { label: 'LINE', color: 'bg-emerald-100 text-emerald-700' },
  meeting: { label: '會議', color: 'bg-purple-100 text-purple-700' },
  visit: { label: '到訪', color: 'bg-amber-100 text-amber-700' },
}

interface Interaction {
  id: string; contact_date: string; subject: string; contact_type: string
  contact_person: string | null; handler: string | null; content: string | null
  target_name: string | null; next_action: string | null; next_action_date: string | null
}

export function CrmClient({ interactions, companies }: { interactions: Interaction[]; companies: { id: string; name: string }[] }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    subject: '', contact_type: 'phone', contact_date: new Date().toISOString().split('T')[0],
    contact_person: '', handler: '', content: '', target_type: 'company' as 'company' | 'person',
    target_id: '', target_name: '', next_action: '', next_action_date: '',
  })
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAdd() {
    if (!form.subject.trim()) return
    const company = companies.find(c => c.id === form.target_id)
    startTransition(async () => {
      await fetch('/api/interactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, target_name: company?.name ?? (form.target_name || null) }),
      })
      setForm({ subject: '', contact_type: 'phone', contact_date: new Date().toISOString().split('T')[0], contact_person: '', handler: '', content: '', target_type: 'company', target_id: '', target_name: '', next_action: '', next_action_date: '' })
      setAdding(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('確定刪除？')) return
    startTransition(async () => {
      await fetch('/api/interactions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      router.refresh()
    })
  }

  return (
    <div>
      {!adding ? (
        <button onClick={() => setAdding(true)} className="mb-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ 新增互動紀錄</button>
      ) : (
        <Card className="mb-4 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="主題 *" autoFocus className="col-span-2 text-sm border border-gray-300 rounded px-2 py-1.5" />
            <select value={form.contact_type} onChange={e => setForm({ ...form, contact_type: e.target.value })} className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
              {Object.entries(CONTACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="date" value={form.contact_date} onChange={e => setForm({ ...form, contact_date: e.target.value })} className="text-sm border border-gray-300 rounded px-2 py-1.5" />
            <input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} placeholder="聯繫人" className="text-sm border border-gray-300 rounded px-2 py-1.5" />
            <input value={form.handler} onChange={e => setForm({ ...form, handler: e.target.value })} placeholder="負責人" className="text-sm border border-gray-300 rounded px-2 py-1.5" />
          </div>
          <select value={form.target_id} onChange={e => setForm({ ...form, target_id: e.target.value })} className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
            <option value="">選擇關聯企業...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="聯繫內容" rows={3} className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
          <div className="grid grid-cols-2 gap-2">
            <input value={form.next_action} onChange={e => setForm({ ...form, next_action: e.target.value })} placeholder="後續行動" className="text-sm border border-gray-300 rounded px-2 py-1.5" />
            <input type="date" value={form.next_action_date} onChange={e => setForm({ ...form, next_action_date: e.target.value })} className="text-sm border border-gray-300 rounded px-2 py-1.5" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={pending || !form.subject.trim()} className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">新增</button>
            <button onClick={() => setAdding(false)} className="text-xs text-gray-400 px-2">取消</button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {interactions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">尚無互動紀錄</p>
        ) : interactions.map(i => {
          const ct = CONTACT_TYPES[i.contact_type] ?? CONTACT_TYPES.phone
          return (
            <Card key={i.id} className="p-4 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded-full px-2 py-0.5 ${ct.color}`}>{ct.label}</span>
                  <span className="text-sm font-medium text-gray-900">{i.subject}</span>
                  {i.target_name && <span className="text-xs text-gray-400">{i.target_name}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{i.contact_date}</span>
                  <button onClick={() => handleDelete(i.id)} className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">刪除</button>
                </div>
              </div>
              {i.content && <p className="text-sm text-gray-600 mb-2">{i.content}</p>}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                {i.contact_person && <span>聯繫人：{i.contact_person}</span>}
                {i.handler && <span>負責人：{i.handler}</span>}
                {i.next_action && <span className="text-amber-600">後續：{i.next_action}{i.next_action_date ? ` (${i.next_action_date})` : ''}</span>}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
