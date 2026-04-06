'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import { addEmployee, updateEmployee, deleteEmployee } from './actions'

const ROLE_LABELS: Record<string, string> = { consultant: '顧問', hr: 'HR', manager: '主管', employee: '員工' }
const EDITABLE_ROLES = ['hr', 'manager', 'employee']

interface Employee {
  id: string; full_name: string | null; email: string; role: string
  department_id: string | null; job_title: string | null
  hire_date: string | null; birthday: string | null
  r1_pattern: string | null; l2_pattern: string | null; created_at: string
}
interface Dept { id: string; name: string }

interface Props {
  employees: Employee[]
  departments: Dept[]
  companyId: string
  companyName: string
  isConsultant: boolean
  enrollStats: Record<string, { total: number; completed: number }>
}

export function EmployeesClient({ employees, departments, companyId, companyName, isConsultant, enrollStats }: Props) {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const deptMap: Record<string, string> = {}
  departments.forEach(d => { deptMap[d.id] = d.name })

  const filtered = search
    ? employees.filter(e =>
        (e.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()))
    : employees

  return (
    <div>
      {/* 搜尋 + 新增按鈕 */}
      <div className="flex items-center gap-3 mb-4">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="搜尋姓名或 email..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {isConsultant && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新增員工
            </button>
            <Link href={`/companies/${companyId}/organization`}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 whitespace-nowrap">
              批次匯入
            </Link>
          </div>
        )}
      </div>

      {/* 員工列表 */}
      <Card>
        <CardHeader>
          <p className="font-semibold text-gray-900">員工列表 ({filtered.length})</p>
        </CardHeader>
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              {search ? '找不到符合的員工' : '尚無員工'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">姓名</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">角色</th>
                  <th className="px-4 py-3 text-left">部門</th>
                  <th className="px-4 py-3 text-left">職稱</th>
                  <th className="px-4 py-3 text-left">生日</th>
                  {isConsultant && <th className="px-4 py-3 text-left">R1 管理力</th>}
                  {isConsultant && <th className="px-4 py-3 text-left">L2 心像力</th>}
                  <th className="px-4 py-3 text-left">年資</th>
                  <th className="px-4 py-3 text-left">學習履歷</th>
                  {isConsultant && <th className="px-4 py-3 text-center">操作</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-indigo-700">
                            {(emp.full_name || emp.email).charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">{emp.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{emp.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.role === 'hr' ? 'purple' : emp.role === 'manager' ? 'info' : 'default'}>
                        {ROLE_LABELS[emp.role] ?? emp.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{deptMap[emp.department_id ?? ''] ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{emp.job_title ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{emp.birthday ?? '—'}</td>
                    {isConsultant && <td className="px-4 py-3 text-xs text-gray-700 font-medium">{emp.r1_pattern ?? '—'}</td>}
                    {isConsultant && <td className="px-4 py-3 text-xs text-gray-700 font-medium">{emp.l2_pattern ?? '—'}</td>}
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {emp.hire_date ? (() => {
                        const years = Math.floor((new Date().getTime() - new Date(emp.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        return `${years} 年`
                      })() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/companies/${companyId}/employees/${emp.id}/passport`}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                        查看 →
                      </Link>
                    </td>
                    {isConsultant && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setEditingId(emp.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-700">編輯</button>
                          <button onClick={() => setDeleteTarget(emp)}
                            className="text-xs text-red-500 hover:text-red-700">刪除</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* 新增員工 Modal */}
      {showAdd && (
        <EmployeeFormModal
          title="新增員工"
          departments={departments}
          pending={pending}
          onClose={() => setShowAdd(false)}
          onSubmit={(data) => {
            startTransition(async () => {
              const result = await addEmployee(companyId, data)
              if (result.error) { alert(result.error); return }
              setShowAdd(false)
              router.refresh()
            })
          }}
        />
      )}

      {/* 編輯員工 Modal */}
      {editingId && (() => {
        const emp = employees.find(e => e.id === editingId)
        if (!emp) return null
        return (
          <EmployeeFormModal
            title="編輯員工"
            departments={departments}
            pending={pending}
            initial={emp}
            onClose={() => setEditingId(null)}
            onSubmit={(data) => {
              startTransition(async () => {
                const result = await updateEmployee(companyId, editingId, data)
                if (result.error) { alert(result.error); return }
                setEditingId(null)
                router.refresh()
              })
            }}
          />
        )
      })()}

      {/* 刪除確認 Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">確認刪除</h3>
            <p className="text-sm text-gray-600 mb-1">
              確定要刪除 <strong>{deleteTarget.full_name || deleteTarget.email}</strong> 嗎？
            </p>
            <p className="text-xs text-red-500 mb-6">此操作將同時刪除帳號和所有相關資料，無法復原。</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
              <button
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await deleteEmployee(companyId, deleteTarget.id)
                    if (result.error) { alert(result.error); return }
                    setDeleteTarget(null)
                    router.refresh()
                  })
                }}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {pending ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** 新增/編輯共用表單 Modal */
function EmployeeFormModal({ title, departments, pending, initial, onClose, onSubmit }: {
  title: string
  departments: Dept[]
  pending: boolean
  initial?: Employee
  onClose: () => void
  onSubmit: (data: {
    email: string; full_name: string; role: string
    department_id: string | null; job_title: string | null
    hire_date: string | null; birthday: string | null
  }) => void
}) {
  const [email, setEmail] = useState(initial?.email ?? '')
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [role, setRole] = useState(initial?.role ?? 'employee')
  const [deptId, setDeptId] = useState(initial?.department_id ?? '')
  const [jobTitle, setJobTitle] = useState(initial?.job_title ?? '')
  const [hireDate, setHireDate] = useState(initial?.hire_date ?? '')
  const [birthday, setBirthday] = useState(initial?.birthday ?? '')

  const isEdit = !!initial

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { alert('請輸入 Email'); return }
    if (!fullName.trim()) { alert('請輸入姓名'); return }
    onSubmit({
      email: email.trim(),
      full_name: fullName.trim(),
      role,
      department_id: deptId || null,
      job_title: jobTitle.trim() || null,
      hire_date: hireDate || null,
      birthday: birthday || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              disabled={isEdit}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="example@email.com" />
            {!isEdit && <p className="text-xs text-gray-400 mt-1">預設密碼：id3a</p>}
          </div>

          {/* 姓名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="王小明" />
          </div>

          {/* 角色 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="employee">員工</option>
              <option value="hr">HR</option>
              <option value="manager">主管</option>
            </select>
          </div>

          {/* 部門 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">部門</label>
            <select value={deptId} onChange={e => setDeptId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">未分配</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          {/* 職稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">職稱</label>
            <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="軟體工程師" />
          </div>

          {/* 到職日 + 生日 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">到職日</label>
              <input type="date" value={hireDate} onChange={e => setHireDate(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">生日</label>
              <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
            <button type="submit" disabled={pending}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {pending ? '處理中...' : isEdit ? '儲存' : '新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
