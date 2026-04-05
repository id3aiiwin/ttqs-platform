'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'

interface Todo {
  id: string; title: string; description: string | null; due_date: string | null
  status: string; priority: string; type: string; related_name: string | null; completed_at: string | null
}

export function TodosClient({ todos, isAdmin }: { todos: Todo[]; isAdmin: boolean }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ title: '', due_date: '', priority: 'normal', description: '' })
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = todos.filter(t => filter === 'all' || t.status === filter)

  function handleAdd() {
    if (!form.title.trim()) return
    startTransition(async () => {
      await fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      setForm({ title: '', due_date: '', priority: 'normal', description: '' })
      setAdding(false)
      router.refresh()
    })
  }

  function handleToggle(id: string, current: string) {
    startTransition(async () => {
      await fetch('/api/todos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: current === 'pending' ? 'completed' : 'pending' }) })
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await fetch('/api/todos', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      router.refresh()
    })
  }

  const isOverdue = (date: string | null) => date && new Date(date) < new Date(new Date().toISOString().split('T')[0])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(['pending', 'completed', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded-full ${filter === f ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'}`}>
              {f === 'pending' ? `待辦 (${todos.filter(t => t.status === 'pending').length})` : f === 'completed' ? '已完成' : '全部'}
            </button>
          ))}
        </div>
        {!adding && <button onClick={() => setAdding(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ 新增</button>}
      </div>

      {adding && (
        <Card className="mb-4 p-3 space-y-2">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="待辦事項 *" autoFocus className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="text-sm border border-gray-300 rounded px-2 py-1.5" />
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
              <option value="high">高優先</option><option value="normal">一般</option><option value="low">低優先</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={pending || !form.title.trim()} className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">新增</button>
            <button onClick={() => setAdding(false)} className="text-xs text-gray-400 px-2">取消</button>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">{filter === 'pending' ? '沒有待辦事項' : '沒有紀錄'}</p>
        ) : filtered.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-lg border group ${t.status === 'completed' ? 'bg-gray-50 border-gray-200' : isOverdue(t.due_date) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <button onClick={() => handleToggle(t.id, t.status)} className="flex-shrink-0">
              {t.status === 'completed' ? (
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                {t.due_date && <span className={isOverdue(t.due_date) && t.status === 'pending' ? 'text-red-500 font-medium' : 'text-gray-400'}>{t.due_date}</span>}
                {t.priority === 'high' && <span className="text-red-500">高優先</span>}
                {t.related_name && <span className="text-gray-400">{t.related_name}</span>}
                {t.type !== 'manual' && <span className="text-indigo-400">{t.type === 'course_prep' ? '課前準備' : '跟進'}</span>}
              </div>
            </div>
            <button onClick={() => handleDelete(t.id)} className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 flex-shrink-0">刪除</button>
          </div>
        ))}
      </div>
    </div>
  )
}
