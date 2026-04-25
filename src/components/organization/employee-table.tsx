'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateEmployeeRole, updateEmployeeDepartment } from '@/app/(dashboard)/companies/[id]/organization/actions'
import { Badge } from '@/components/ui/badge'

const ROLE_LABELS: Record<string, string> = { hr: 'HR', manager: '主管', employee: '員工' }

interface Employee {
  id: string; full_name: string | null; email: string; role: string
  department_id: string | null; created_at: string
}
interface Dept { id: string; name: string; parent_id: string | null }

export function EmployeeTable({ employees, departments, deptMap, companyId, isConsultant }: {
  employees: Employee[]
  departments: Dept[]
  deptMap: Record<string, { name: string; managerId: string | null }>
  companyId: string
  isConsultant: boolean
}) {
  if (employees.length === 0) {
    return <div className="px-6 py-12 text-center text-sm text-gray-400">尚無員工資料</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
          <tr>
            <th className="px-5 py-2 text-left">姓名</th>
            <th className="px-4 py-2 text-left">Email</th>
            <th className="px-4 py-2 text-center">角色</th>
            <th className="px-4 py-2 text-left">部門／科別</th>
            <th className="px-4 py-2 text-center">加入日期</th>
            {isConsultant && <th className="px-4 py-2 text-center">操作</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {employees.map(emp => (
            <EmployeeRow key={emp.id} emp={emp} departments={departments} deptMap={deptMap}
              companyId={companyId} isConsultant={isConsultant} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmployeeRow({ emp, departments, deptMap, companyId, isConsultant }: {
  emp: Employee; departments: Dept[]; deptMap: Record<string, { name: string; managerId: string | null }>
  companyId: string; isConsultant: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [role, setRole] = useState(emp.role)
  const [deptId, setDeptId] = useState(emp.department_id ?? '')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const topLevel = departments.filter(d => !d.parent_id)
  const sections = (parentId: string) => departments.filter(d => d.parent_id === parentId)

  // 組合顯示名稱：若是科別，顯示「部門 / 科別」
  function getDeptLabel(id: string | null) {
    if (!id) return null
    const d = departments.find(x => x.id === id)
    if (!d) return deptMap[id]?.name ?? '—'
    if (d.parent_id) {
      const parent = departments.find(x => x.id === d.parent_id)
      return parent ? `${parent.name} / ${d.name}` : d.name
    }
    return d.name
  }

  function handleSave() {
    startTransition(async () => {
      if (role !== emp.role) await updateEmployeeRole(emp.id, role, companyId)
      if (deptId !== (emp.department_id ?? '')) await updateEmployeeDepartment(emp.id, deptId || null, companyId)
      setEditing(false); router.refresh()
    })
  }

  const deptLabel = getDeptLabel(emp.department_id)
  const joinDate = new Date(emp.created_at).toLocaleDateString('zh-TW')

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-3">
        <Link href={`/companies/${companyId}/employees/${emp.id}/passport`}
          className="font-medium text-gray-900 hover:text-indigo-600">
          {emp.full_name || '未設定'}
        </Link>
      </td>
      <td className="px-4 py-3 text-gray-500">{emp.email}</td>
      <td className="px-4 py-3 text-center">
        {editing ? (
          <select value={role} onChange={e => setRole(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white">
            <option value="hr">HR</option>
            <option value="manager">主管</option>
            <option value="employee">員工</option>
          </select>
        ) : (
          <Badge variant={role === 'hr' ? 'purple' : role === 'manager' ? 'info' : 'default'}>
            {ROLE_LABELS[role] ?? role}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          /* 兩層下拉：optgroup = 部門，option = 科別 */
          <select value={deptId} onChange={e => setDeptId(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white min-w-[140px]">
            <option value="">未分配</option>
            {topLevel.map(d => {
              const secs = sections(d.id)
              return secs.length > 0 ? (
                <optgroup key={d.id} label={d.name}>
                  <option value={d.id}>【{d.name}】（直屬）</option>
                  {secs.map(s => <option key={s.id} value={s.id}>　└ {s.name}</option>)}
                </optgroup>
              ) : (
                <option key={d.id} value={d.id}>{d.name}</option>
              )
            })}
          </select>
        ) : (
          <span className={deptLabel ? 'text-gray-700' : 'text-amber-500 text-xs'}>
            {deptLabel ?? '未分配'}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center text-xs text-gray-400">{joinDate}</td>
      {isConsultant && (
        <td className="px-4 py-3 text-center">
          {editing ? (
            <div className="flex items-center justify-center gap-1">
              <button onClick={handleSave} disabled={pending}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">儲存</button>
              <button onClick={() => { setEditing(false); setRole(emp.role); setDeptId(emp.department_id ?? '') }}
                className="text-xs text-gray-400 hover:text-gray-600">取消</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="text-xs text-indigo-600 hover:text-indigo-700">編輯</button>
          )}
        </td>
      )}
    </tr>
  )
}
