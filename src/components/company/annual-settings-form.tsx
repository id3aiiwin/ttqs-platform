'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  companyId: string
  settings: Record<string, unknown>
}

export function AnnualSettingsForm({ companyId, settings }: Props) {
  const [form, setForm] = useState({
    annualBudget: String(settings.annualBudget ?? ''),
    plannedCourses: String(settings.plannedCourses ?? ''),
    contractStartDate: String(settings.contractStartDate ?? ''),
    contractEndDate: String(settings.contractEndDate ?? ''),
    trainingNotes: String(settings.trainingNotes ?? ''),
  })
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  function handleSave() {
    startTransition(async () => {
      await fetch('/api/company-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          annual_settings: {
            annualBudget: form.annualBudget ? Number(form.annualBudget) : null,
            plannedCourses: form.plannedCourses ? Number(form.plannedCourses) : null,
            contractStartDate: form.contractStartDate || null,
            contractEndDate: form.contractEndDate || null,
            trainingNotes: form.trainingNotes || null,
          },
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">年度訓練預算</label>
          <input type="number" value={form.annualBudget} onChange={e => setForm({ ...form, annualBudget: e.target.value })}
            placeholder="例：500000" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-gray-500">計畫課程數</label>
          <input type="number" value={form.plannedCourses} onChange={e => setForm({ ...form, plannedCourses: e.target.value })}
            placeholder="例：12" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-gray-500">合約起始日</label>
          <input type="date" value={form.contractStartDate} onChange={e => setForm({ ...form, contractStartDate: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-xs text-gray-500">合約到期日</label>
          <input type="date" value={form.contractEndDate} onChange={e => setForm({ ...form, contractEndDate: e.target.value })}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500">訓練排程備注</label>
        <textarea value={form.trainingNotes} onChange={e => setForm({ ...form, trainingNotes: e.target.value })}
          rows={3} placeholder="訓練排程相關備注..." className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
      </div>
      <div className="flex items-center gap-2">
        <button onClick={handleSave} disabled={pending}
          className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-1.5 disabled:opacity-50">
          {pending ? '儲存...' : '儲存'}
        </button>
        {saved && <span className="text-xs text-green-600">已儲存</span>}
      </div>
    </div>
  )
}
