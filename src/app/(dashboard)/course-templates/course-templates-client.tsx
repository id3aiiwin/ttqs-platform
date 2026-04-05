'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Template {
  id: string; name: string; course_type: string; hours: number | null; description: string | null; default_fee: number | null; created_at: string
}

export function CourseTemplatesClient({ templates }: { templates: Template[] }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', course_type: 'public', hours: '', default_fee: '', description: '' })
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAdd() {
    if (!form.name.trim()) return
    startTransition(async () => {
      await fetch('/api/course-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), course_type: form.course_type, hours: form.hours ? Number(form.hours) : null, default_fee: form.default_fee ? Number(form.default_fee) : null, description: form.description || null }),
      })
      setForm({ name: '', course_type: 'public', hours: '', default_fee: '', description: '' })
      setAdding(false)
      router.refresh()
    })
  }

  function handleDelete(id: string) {
    if (!confirm('確定刪除？')) return
    startTransition(async () => {
      await fetch('/api/course-templates', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      router.refresh()
    })
  }

  return (
    <div>
      {!adding ? (
        <button onClick={() => setAdding(true)} className="mb-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ 新增模板</button>
      ) : (
        <Card className="mb-4 p-4 space-y-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="模板名稱 *" autoFocus
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
          <div className="grid grid-cols-3 gap-2">
            <select value={form.course_type} onChange={e => setForm({ ...form, course_type: e.target.value })}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <option value="public">公開課</option>
              <option value="enterprise">企業內訓</option>
            </select>
            <input type="number" value={form.hours} onChange={e => setForm({ ...form, hours: e.target.value })} placeholder="時數"
              className="text-sm border border-gray-300 rounded-lg px-3 py-2" />
            <input type="number" value={form.default_fee} onChange={e => setForm({ ...form, default_fee: e.target.value })} placeholder="預設費用"
              className="text-sm border border-gray-300 rounded-lg px-3 py-2" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="說明" rows={2}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={pending || !form.name.trim()}
              className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">建立</button>
            <button onClick={() => setAdding(false)} className="text-xs text-gray-400 px-2">取消</button>
          </div>
        </Card>
      )}

      <Card>
        <div className="divide-y divide-gray-100">
          {templates.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">尚無課程模板</p>
          ) : templates.map(t => (
            <div key={t.id} className="px-6 py-3 flex items-center justify-between group">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                  <Badge variant={t.course_type === 'enterprise' ? 'info' : 'warning'}>{t.course_type === 'enterprise' ? '企業' : '公開'}</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t.hours ? `${t.hours}h` : '—'}{t.default_fee ? ` · NT$${t.default_fee.toLocaleString()}` : ''}{t.description ? ` · ${t.description}` : ''}
                </p>
              </div>
              <button onClick={() => handleDelete(t.id)} disabled={pending}
                className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100">刪除</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
