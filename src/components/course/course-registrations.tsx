'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_COLORS: Record<string, { label: string; bg: string }> = {
  unpaid:    { label: '未匯款', bg: 'bg-orange-100 text-orange-700' },
  paid:      { label: '已匯款', bg: 'bg-blue-100 text-blue-700' },
  confirmed: { label: '已確認', bg: 'bg-green-100 text-green-700' },
}

interface Registration {
  id: string
  student_name: string | null
  student_email: string | null
  student_phone: string | null
  fee: number
  payment_status: string
  payment_date: string | null
  account_last5: string | null
}

interface Props {
  courseId: string
  registrations: Registration[]
  defaultFee: number | null
  isConsultant: boolean
}

export function CourseRegistrations({ courseId, registrations, defaultFee, isConsultant }: Props) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', fee: String(defaultFee ?? 0) })
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const totalFee = registrations.reduce((sum, r) => sum + (r.fee ?? 0), 0)
  const paidCount = registrations.filter(r => r.payment_status === 'paid' || r.payment_status === 'confirmed').length
  const confirmedCount = registrations.filter(r => r.payment_status === 'confirmed').length

  function handleAdd() {
    if (!form.name.trim()) return
    startTransition(async () => {
      await fetch('/api/course-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, student_name: form.name.trim(), student_email: form.email.trim() || null, student_phone: form.phone.trim() || null, fee: Number(form.fee) || 0 }),
      })
      setForm({ name: '', email: '', phone: '', fee: String(defaultFee ?? 0) })
      setAdding(false)
      router.refresh()
    })
  }

  function handleStatusChange(regId: string, status: string) {
    startTransition(async () => {
      await fetch('/api/course-registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regId, payment_status: status, payment_date: status !== 'unpaid' ? new Date().toISOString().split('T')[0] : null }),
      })
      router.refresh()
    })
  }

  function handleDelete(regId: string) {
    if (!confirm('確定移除此學員？')) return
    startTransition(async () => {
      await fetch('/api/course-registrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: regId }),
      })
      router.refresh()
    })
  }

  return (
    <div>
      {/* 摘要 */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-gray-500">報名 <strong>{registrations.length}</strong> 人</span>
        <span className="text-green-600">已確認 <strong>{confirmedCount}</strong></span>
        <span className="text-blue-600">已匯款 <strong>{paidCount}</strong></span>
        <span className="text-gray-500">預估營收 <strong className="text-gray-900">NT$ {totalFee.toLocaleString()}</strong></span>
      </div>

      {/* 學員列表 */}
      {registrations.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">姓名</th>
                <th className="px-4 py-2 text-left">聯絡</th>
                <th className="px-4 py-2 text-right">費用</th>
                <th className="px-4 py-2 text-center">匯款狀態</th>
                <th className="px-4 py-2 text-left">帳號末5碼</th>
                {isConsultant && <th className="px-4 py-2 text-center">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registrations.map(r => {
                const st = STATUS_COLORS[r.payment_status] ?? STATUS_COLORS.unpaid
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{r.student_name ?? '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">
                      {r.student_email && <div>{r.student_email}</div>}
                      {r.student_phone && <div>{r.student_phone}</div>}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-700">NT$ {(r.fee ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      {isConsultant ? (
                        <select value={r.payment_status} onChange={e => handleStatusChange(r.id, e.target.value)}
                          className={`text-xs rounded-full px-2 py-0.5 border-0 ${st.bg}`}>
                          <option value="unpaid">未匯款</option>
                          <option value="paid">已匯款</option>
                          <option value="confirmed">已確認</option>
                        </select>
                      ) : (
                        <span className={`text-xs rounded-full px-2 py-0.5 ${st.bg}`}>{st.label}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-400 font-mono">{r.account_last5 ?? '—'}</td>
                    {isConsultant && (
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-600">移除</button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 新增學員 */}
      {isConsultant && (
        adding ? (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="姓名 *" autoFocus
                className="text-sm border border-gray-300 rounded px-2 py-1.5" />
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email"
                className="text-sm border border-gray-300 rounded px-2 py-1.5" />
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="電話"
                className="text-sm border border-gray-300 rounded px-2 py-1.5" />
              <input type="number" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} placeholder="費用"
                className="text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={pending || !form.name.trim()}
                className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-3 py-1.5 disabled:opacity-50">新增</button>
              <button onClick={() => setAdding(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">取消</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500">
            + 新增學員報名
          </button>
        )
      )}
    </div>
  )
}
