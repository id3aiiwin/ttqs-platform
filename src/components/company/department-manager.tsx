'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDepartment, updateDepartment, deleteDepartment } from '@/app/(dashboard)/companies/[id]/settings/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Dept {
  id: string; name: string; manager_id: string | null; sort_order: number
  is_active: boolean; employeeCount: number
}

interface Person { id: string; name: string }

export function DepartmentManager({ companyId, departments, people }: {
  companyId: string; departments: Dept[]; people: Person[]
}) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newManager, setNewManager] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAdd() {
    if (!newName.trim()) return
    startTransition(async () => {
      const result = await addDepartment(companyId, newName.trim(), newManager || undefined)
      if (result?.error) alert(result.error)
      setNewName(''); setNewManager(''); setAdding(false); router.refresh()
    })
  }

  return (
    <div>
      {departments.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">尚未設定部門</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {departments.map((dept) => (
            <DepartmentItem key={dept.id} dept={dept} companyId={companyId} people={people} />
          ))}
        </div>
      )}

      <div className="p-4 border-t border-gray-100">
        {adding ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input value={newName} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                placeholder="部門名稱..." autoFocus
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500" />
              <select value={newManager} onChange={(e) => setNewManager(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                <option value="">指定主管（選填）</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" loading={pending} onClick={handleAdd} disabled={!newName.trim()}>新增</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewName('') }}>取消</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ 新增部門</button>
        )}
      </div>
    </div>
  )
}

function DepartmentItem({ dept, companyId, people }: { dept: Dept; companyId: string; people: Person[] }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(dept.name)
  const [managerId, setManagerId] = useState(dept.manager_id ?? '')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const managerName = people.find((p) => p.id === dept.manager_id)?.name

  function handleSave() {
    startTransition(async () => {
      await updateDepartment(dept.id, companyId, { name: name.trim(), managerId: managerId || null })
      setEditing(false); router.refresh()
    })
  }

  function handleToggleActive() {
    startTransition(async () => {
      await updateDepartment(dept.id, companyId, { isActive: !dept.is_active })
      router.refresh()
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDepartment(dept.id, companyId)
      if (result?.error) alert(result.error)
      else router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="px-6 py-3 flex flex-col gap-2 bg-gray-50">
        <div className="flex items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-indigo-500" autoFocus />
          <select value={managerId} onChange={(e) => setManagerId(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white">
            <option value="">無主管</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" loading={pending} onClick={handleSave}>儲存</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>取消</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-3 flex items-center gap-3 group hover:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900 font-medium">{dept.name}</span>
          {!dept.is_active && <Badge variant="default">已停用</Badge>}
        </div>
        {managerName && <p className="text-xs text-gray-400 mt-0.5">主管：{managerName}</p>}
      </div>

      <span className="text-xs text-gray-400">{dept.employeeCount} 人</span>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="text-xs text-indigo-600 px-1">編輯</button>
        <button onClick={handleToggleActive} disabled={pending}
          className="text-xs text-gray-500 px-1">{dept.is_active ? '停用' : '啟用'}</button>
        {dept.employeeCount === 0 ? (
          <button onClick={handleDelete} disabled={pending} className="text-xs text-red-400 px-1">刪除</button>
        ) : (
          <span className="text-xs text-gray-300" title="有員工無法刪除">不可刪</span>
        )}
      </div>
    </div>
  )
}
