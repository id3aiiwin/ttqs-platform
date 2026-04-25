'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addDepartment, updateDepartment, deleteDepartment } from '@/app/(dashboard)/companies/[id]/settings/actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Dept {
  id: string; name: string; manager_id: string | null; sort_order: number
  is_active: boolean; employeeCount: number; parent_id: string | null
}
interface Person { id: string; name: string }

/* ------------------------------------------------------------------ */
/*  Root component                                                      */
/* ------------------------------------------------------------------ */

export function DepartmentManager({ companyId, departments, people }: {
  companyId: string; departments: Dept[]; people: Person[]
}) {
  const [addingTop, setAddingTop] = useState(false)
  const [newName, setNewName] = useState('')
  const [newManager, setNewManager] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const topLevel = departments.filter(d => !d.parent_id)
  const sections = (parentId: string) => departments.filter(d => d.parent_id === parentId)

  function handleAddTop() {
    if (!newName.trim()) return
    startTransition(async () => {
      const result = await addDepartment(companyId, newName.trim(), newManager || undefined)
      if (result?.error) alert(result.error)
      setNewName(''); setNewManager(''); setAddingTop(false); router.refresh()
    })
  }

  return (
    <div>
      {topLevel.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-gray-400">尚未設定部門</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {topLevel.map(dept => (
            <DeptBlock
              key={dept.id}
              dept={dept}
              sections={sections(dept.id)}
              companyId={companyId}
              people={people}
            />
          ))}
        </div>
      )}

      {/* 新增頂層部門 */}
      <div className="p-4 border-t border-gray-100">
        {addingTop ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTop()}
                placeholder="部門名稱..." autoFocus
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500" />
              <select value={newManager} onChange={e => setNewManager(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
                <option value="">指定主管（選填）</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" loading={pending} onClick={handleAddTop} disabled={!newName.trim()}>新增部門</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingTop(false); setNewName('') }}>取消</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingTop(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ 新增部門</button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  One department block (with nested sections)                        */
/* ------------------------------------------------------------------ */

function DeptBlock({ dept, sections, companyId, people }: {
  dept: Dept; sections: Dept[]; companyId: string; people: Person[]
}) {
  const [addingSection, setAddingSection] = useState(false)
  const [secName, setSecName] = useState('')
  const [secManager, setSecManager] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleAddSection() {
    if (!secName.trim()) return
    startTransition(async () => {
      const result = await addDepartment(companyId, secName.trim(), secManager || undefined, dept.id)
      if (result?.error) alert(result.error)
      setSecName(''); setSecManager(''); setAddingSection(false); router.refresh()
    })
  }

  return (
    <div className="px-4 py-3">
      {/* 部門列 */}
      <div className="flex items-center gap-2 group">
        <span className="text-sm font-semibold text-gray-800 w-4">▸</span>
        <div className="flex-1 min-w-0">
          <DeptItem dept={dept} companyId={companyId} people={people} isSection={false} />
        </div>
      </div>

      {/* 科別列表 */}
      {sections.length > 0 && (
        <div className="ml-6 mt-1.5 flex flex-col gap-1 border-l-2 border-gray-100 pl-3">
          {sections.map(sec => (
            <DeptItem key={sec.id} dept={sec} companyId={companyId} people={people} isSection />
          ))}
        </div>
      )}

      {/* 新增科別 */}
      <div className="ml-6 mt-1.5 pl-3 border-l-2 border-gray-100">
        {addingSection ? (
          <div className="flex flex-col gap-1.5 py-1">
            <div className="flex items-center gap-2">
              <input value={secName} onChange={e => setSecName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSection()}
                placeholder="科別名稱..." autoFocus
                className="flex-1 text-sm border border-gray-300 rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500" />
              <select value={secManager} onChange={e => setSecManager(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2.5 py-1 bg-white">
                <option value="">指定主管（選填）</option>
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" loading={pending} onClick={handleAddSection} disabled={!secName.trim()}>新增科別</Button>
              <Button size="sm" variant="ghost" onClick={() => { setAddingSection(false); setSecName('') }}>取消</Button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingSection(true)}
            className="text-xs text-indigo-500 hover:text-indigo-700 py-0.5">+ 新增科別</button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Single dept/section row (inline edit)                              */
/* ------------------------------------------------------------------ */

function DeptItem({ dept, companyId, people, isSection }: {
  dept: Dept; companyId: string; people: Person[]; isSection: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(dept.name)
  const [managerId, setManagerId] = useState(dept.manager_id ?? '')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const managerName = people.find(p => p.id === dept.manager_id)?.name

  function handleSave() {
    startTransition(async () => {
      await updateDepartment(dept.id, companyId, { name: name.trim(), managerId: managerId || null })
      setEditing(false); router.refresh()
    })
  }
  function handleToggle() {
    startTransition(async () => {
      await updateDepartment(dept.id, companyId, { isActive: !dept.is_active })
      router.refresh()
    })
  }
  function handleDelete() {
    if (!confirm(`確定刪除「${dept.name}」？`)) return
    startTransition(async () => {
      const result = await deleteDepartment(dept.id, companyId)
      if (result?.error) alert(result.error)
      else router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 py-1 bg-gray-50 rounded-lg px-2">
        <div className="flex items-center gap-2">
          <input value={name} onChange={e => setName(e.target.value)}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500" autoFocus />
          <select value={managerId} onChange={e => setManagerId(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white">
            <option value="">無主管</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" loading={pending} onClick={handleSave}>儲存</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>取消</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 group py-1 hover:bg-gray-50 rounded px-1">
      {isSection && <span className="text-gray-300 text-xs">└</span>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-medium ${isSection ? 'text-xs text-gray-700' : 'text-sm text-gray-900'}`}>{dept.name}</span>
          {!dept.is_active && <Badge variant="default">已停用</Badge>}
          <span className="text-xs text-gray-400">{dept.employeeCount} 人</span>
        </div>
        {managerName && <p className="text-xs text-gray-400">主管：{managerName}</p>}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)} className="text-xs text-indigo-600 px-1 hover:underline">編輯</button>
        <button onClick={handleToggle} disabled={pending} className="text-xs text-gray-500 px-1 hover:underline">
          {dept.is_active ? '停用' : '啟用'}
        </button>
        {dept.employeeCount === 0 ? (
          <button onClick={handleDelete} disabled={pending} className="text-xs text-red-400 px-1 hover:underline">刪除</button>
        ) : (
          <span className="text-xs text-gray-300 px-1" title="有員工無法刪除">不可刪</span>
        )}
      </div>
    </div>
  )
}
