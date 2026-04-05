'use client'

import { useState } from 'react'
import { createMeeting } from '@/app/(dashboard)/meetings/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface MeetingFormProps {
  companies: { id: string; name: string }[]
  consultants: { id: string; full_name: string | null; email: string }[]
  defaultCompanyId?: string
}

interface ActionItemDraft {
  id: string
  content: string
  assignee: string
  dueDate: string
  addToTodo: boolean
}

export function MeetingForm({ companies, consultants, defaultCompanyId }: MeetingFormProps) {
  const [actionItems, setActionItems] = useState<ActionItemDraft[]>([])
  const [submitting, setSubmitting] = useState(false)

  function addActionItem() {
    setActionItems((prev) => [...prev, {
      id: Math.random().toString(36).slice(2),
      content: '', assignee: '', dueDate: '', addToTodo: false,
    }])
  }

  function updateAI(id: string, field: string, value: string | boolean) {
    setActionItems((prev) => prev.map((ai) => ai.id === id ? { ...ai, [field]: value } : ai))
  }

  function removeAI(id: string) {
    setActionItems((prev) => prev.filter((ai) => ai.id !== id))
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true)
    // 把 action items 加進 formData
    actionItems.forEach((ai) => {
      formData.append('ai_content', ai.content)
      formData.append('ai_assignee', ai.assignee)
      formData.append('ai_due_date', ai.dueDate)
      formData.append('ai_todo', ai.addToTodo ? 'true' : 'false')
    })
    await createMeeting(formData)
    setSubmitting(false)
  }

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }))
  const typeOptions = [
    { value: 'onsite', label: '現場' },
    { value: 'online', label: '視訊' },
    { value: 'phone', label: '電話' },
  ]

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <Select
        id="company_id" name="company_id" label="企業 *"
        options={companyOptions} placeholder="選擇企業"
        defaultValue={defaultCompanyId ?? ''} required
      />

      <div className="grid grid-cols-3 gap-4">
        <Input id="meeting_date" name="meeting_date" type="date" label="日期 *" required />
        <Input id="meeting_time" name="meeting_time" type="time" label="時間" />
        <Select id="meeting_type" name="meeting_type" label="形式" options={typeOptions} defaultValue="onsite" />
      </div>

      {/* 顧問出席 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">出席顧問</p>
        <div className="flex flex-wrap gap-3">
          {consultants.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" name="attendees_consultant" value={c.id}
                className="rounded border-gray-300 text-indigo-600" />
              {c.full_name || c.email}
            </label>
          ))}
        </div>
      </div>

      <Input id="attendees_company" name="attendees_company" label="企業出席人員"
        placeholder="例：HR 陳小姐、製造部王主管" />

      <Textarea id="discussion_points" name="discussion_points" label="討論重點與決議"
        placeholder="會議討論內容、決議事項..." rows={6} />

      {/* Action Items */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Action Items</p>
          <button type="button" onClick={addActionItem}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            + 新增
          </button>
        </div>

        {actionItems.length === 0 ? (
          <p className="text-xs text-gray-400 py-2">尚無 Action Item，點擊右上角新增</p>
        ) : (
          <div className="flex flex-col gap-3">
            {actionItems.map((ai, idx) => (
              <div key={ai.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-xs text-gray-400 mt-1">{idx + 1}.</span>
                  <input
                    value={ai.content}
                    onChange={(e) => updateAI(ai.id, 'content', e.target.value)}
                    placeholder="待辦事項內容..."
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                  />
                  <button type="button" onClick={() => removeAI(ai.id)}
                    className="text-gray-300 hover:text-red-400 mt-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <select value={ai.assignee} onChange={(e) => updateAI(ai.id, 'assignee', e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white">
                    <option value="">負責人</option>
                    {consultants.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                    ))}
                  </select>
                  <input type="date" value={ai.dueDate}
                    onChange={(e) => updateAI(ai.id, 'dueDate', e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1" />
                  <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer ml-auto">
                    <input type="checkbox" checked={ai.addToTodo}
                      onChange={(e) => updateAI(ai.id, 'addToTodo', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600" />
                    加入待辦
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => history.back()}>取消</Button>
        <Button type="submit" loading={submitting}>建立會議記錄</Button>
      </div>
    </form>
  )
}
