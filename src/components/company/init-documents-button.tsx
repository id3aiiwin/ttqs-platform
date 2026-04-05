'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { applyTemplateToCompany } from '@/app/(dashboard)/knowledge-base/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const TIER_LABELS: Record<number, string> = { 1: '一階', 2: '二階', 3: '三階', 4: '四階' }

interface Template {
  id: string; name: string; tier: number | null; pddro_phase: string
  ttqs_indicator: string | null; review_reminders: { section: string; description: string }[]
}

export function InitDocumentsButton({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)
  const [result, setResult] = useState<{ applied: number; reminders: { name: string; items: string[] }[] } | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (open) {
      fetch('/api/knowledge-base-templates')
        .then((r) => r.json())
        .then((data) => {
          setTemplates(data ?? [])
          setSelected(new Set((data ?? []).map((t: Template) => t.id)))
        })
    }
  }, [open])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function handleApply() {
    setApplying(true)
    const reminders: { name: string; items: string[] }[] = []
    let applied = 0

    for (const id of selected) {
      const t = templates.find((t) => t.id === id)
      const res = await applyTemplateToCompany(id, companyId)
      if (!('error' in res)) {
        applied++
        const r = t?.review_reminders ?? []
        if (r.length > 0) reminders.push({ name: t?.name ?? '', items: r.map((ri) => ri.section) })
      }
    }

    setResult({ applied, reminders })
    setApplying(false)
    router.refresh()
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>從知識庫選取範本</Button>
  }

  if (result) {
    return (
      <div className="max-w-lg">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-green-700 font-medium">已套用 {result.applied} 份範本</p>
        </div>
        {result.reminders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-amber-700 font-medium mb-2">以下文件有項目需依貴公司實際狀況修改：</p>
            {result.reminders.map((r, i) => (
              <div key={i} className="mb-2">
                <p className="text-xs font-medium text-amber-800">{r.name}</p>
                <ul className="list-disc list-inside text-xs text-amber-700 ml-2">
                  {r.items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
        <Button size="sm" variant="secondary" onClick={() => { setOpen(false); setResult(null) }}>完成</Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-900">選擇要套用的範本</p>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-gray-400 py-4">載入中...</p>
      ) : (
        <div className="flex flex-col gap-1 mb-4 max-h-80 overflow-y-auto">
          {templates.map((t) => (
            <label key={t.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selected.has(t.id) ? 'bg-indigo-50 border border-indigo-200' : 'border border-gray-200 hover:bg-gray-50'
              }`}>
              <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleSelect(t.id)}
                className="rounded border-gray-300 text-indigo-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{t.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {t.tier && <span>{TIER_LABELS[t.tier]}</span>}
                  {t.ttqs_indicator && <span>指標 {t.ttqs_indicator}</span>}
                </div>
              </div>
              {t.review_reminders?.length > 0 && (
                <Badge variant="warning">{t.review_reminders.length} 項需確認</Badge>
              )}
            </label>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button size="sm" loading={applying} onClick={handleApply} disabled={selected.size === 0}>
          套用 {selected.size} 份範本
        </Button>
        <span className="text-xs text-gray-400">系統會自動替換公司名稱和文件編號</span>
      </div>
    </div>
  )
}
