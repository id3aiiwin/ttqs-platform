'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addIdp, updateIdpStatus, deleteIdp } from '@/app/(dashboard)/companies/[id]/employees/[employeeId]/passport/actions'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Idp {
  id: string
  competency_name: string
  current_level: number
  target_level: number
  target_date: string | null
  related_courses: unknown[]
  status: string
  consultant_notes: string | null
  created_at: string
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'warning' | 'success' }> = {
  in_progress: { label: '進行中', variant: 'warning' },
  completed: { label: '已完成', variant: 'success' },
  paused: { label: '暫停', variant: 'default' },
}

export function IdpList({
  idps, companyId, employeeId, isConsultant,
}: {
  idps: Idp[]
  companyId: string
  employeeId: string
  isConsultant: boolean
}) {
  const [adding, setAdding] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // 新增表單 state
  const [name, setName] = useState('')
  const [curLevel, setCurLevel] = useState(1)
  const [tarLevel, setTarLevel] = useState(3)
  const [tarDate, setTarDate] = useState('')
  const [notes, setNotes] = useState('')

  function handleAdd() {
    if (!name.trim()) return
    startTransition(async () => {
      await addIdp(companyId, employeeId, {
        competency_name: name.trim(),
        current_level: curLevel,
        target_level: tarLevel,
        target_date: tarDate || undefined,
        consultant_notes: notes || undefined,
      })
      setName(''); setCurLevel(1); setTarLevel(3); setTarDate(''); setNotes('')
      setAdding(false)
      router.refresh()
    })
  }

  function handleStatusChange(idpId: string, status: string) {
    startTransition(async () => {
      await updateIdpStatus(idpId, status, companyId, employeeId)
      router.refresh()
    })
  }

  function handleDelete(idpId: string) {
    if (!confirm('確定刪除此發展計畫？')) return
    startTransition(async () => {
      await deleteIdp(idpId, companyId, employeeId)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900">IDP 個人發展計畫</p>
          {isConsultant && !adding && (
            <Button size="sm" onClick={() => setAdding(true)}>+ 新增 IDP</Button>
          )}
        </div>
      </CardHeader>

      {/* 新增表單 */}
      {adding && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">目標職能 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="例：專案管理" className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">預計達成日</label>
              <input type="date" value={tarDate} onChange={(e) => setTarDate(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">目前等級</label>
              <select value={curLevel} onChange={(e) => setCurLevel(Number(e.target.value))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>L{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">目標等級</label>
              <select value={tarLevel} onChange={(e) => setTarLevel(Number(e.target.value))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>L{n}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-500 block mb-1">顧問備註</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} placeholder="發展建議、建議課程..."
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-y" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" loading={pending} onClick={handleAdd} disabled={!name.trim()}>建立</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>取消</Button>
          </div>
        </div>
      )}

      {idps.length === 0 && !adding ? (
        <CardBody><p className="text-center text-sm text-gray-400 py-8">尚無發展計畫</p></CardBody>
      ) : (
        <div className="divide-y divide-gray-100">
          {idps.map((idp) => {
            const st = STATUS_MAP[idp.status] ?? STATUS_MAP.in_progress
            const progress = idp.target_level > idp.current_level
              ? ((idp.current_level - 1) / (idp.target_level - 1)) * 100
              : 100
            return (
              <div key={idp.id} className="px-6 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-sm font-medium text-gray-900 flex-1">{idp.competency_name}</p>
                  <Badge variant={st.variant}>{st.label}</Badge>
                  {isConsultant && (
                    <div className="flex items-center gap-1">
                      {idp.status === 'in_progress' && (
                        <button onClick={() => handleStatusChange(idp.id, 'completed')}
                          className="text-xs text-green-600 hover:text-green-700">完成</button>
                      )}
                      {idp.status !== 'in_progress' && (
                        <button onClick={() => handleStatusChange(idp.id, 'in_progress')}
                          className="text-xs text-blue-600 hover:text-blue-700">恢復</button>
                      )}
                      <button onClick={() => handleDelete(idp.id)}
                        className="text-xs text-red-400 hover:text-red-600 ml-1">刪除</button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm mb-2">
                  <span className="text-gray-500">L{idp.current_level} → L{idp.target_level}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                  {idp.target_date && (
                    <span className="text-xs text-gray-400">目標：{idp.target_date}</span>
                  )}
                </div>
                {idp.consultant_notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">{idp.consultant_notes}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
