'use client'

import { useState, useEffect, useCallback } from 'react'

interface EnrolledStudent {
  id: string
  employee_id: string
  full_name: string | null
  email: string
  status: string
  completion_date: string | null
  score: number | null
}

interface AvailableStudent {
  id: string
  full_name: string | null
  email: string
}

interface Props {
  courseId: string
  companyId: string | null
  courseType: string
  isConsultant: boolean
}

export function CourseEnrollmentManager({ courseId, companyId, courseType, isConsultant }: Props) {
  const [enrolled, setEnrolled] = useState<EnrolledStudent[]>([])
  const [available, setAvailable] = useState<AvailableStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const fetchEnrolled = useCallback(async () => {
    const res = await fetch(`/api/course-enrollment-manage?course_id=${courseId}`)
    if (res.ok) {
      const data = await res.json()
      setEnrolled(data)
    }
  }, [courseId])

  const fetchAvailable = useCallback(async () => {
    // For enterprise courses: fetch company employees
    // For public courses: fetch all profiles
    let url = '/api/profiles?'
    if (courseType === 'enterprise' && companyId) {
      url += `company_id=${companyId}`
    } else {
      url += 'all=true'
    }
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      setAvailable(data)
    }
  }, [courseType, companyId])

  useEffect(() => {
    Promise.all([fetchEnrolled(), fetchAvailable()]).finally(() => setLoading(false))
  }, [fetchEnrolled, fetchAvailable])

  const enrolledIds = new Set(enrolled.map(e => e.employee_id))

  // Filter available students: exclude already enrolled, apply search
  const filteredAvailable = available
    .filter(s => !enrolledIds.has(s.id))
    .filter(s => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (s.full_name?.toLowerCase().includes(q)) || s.email.toLowerCase().includes(q)
    })

  async function handleAdd() {
    if (selected.size === 0) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/course-enrollment-manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, employee_ids: Array.from(selected) }),
      })
      if (res.ok) {
        setShowModal(false)
        setSelected(new Set())
        setSearch('')
        await fetchEnrolled()
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove(employeeId: string, name: string | null) {
    if (!confirm(`確定移除學員「${name ?? '未命名'}」？`)) return
    const res = await fetch('/api/course-enrollment-manage', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course_id: courseId, employee_id: employeeId }),
    })
    if (res.ok) {
      await fetchEnrolled()
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="text-sm text-gray-400 py-4 text-center">載入中...</div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">
          參訓學員 ({enrolled.length} 位)
        </h2>
        {isConsultant && (
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-3 py-1.5 flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新增學員
          </button>
        )}
      </div>

      {/* Enrolled list */}
      {enrolled.length > 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">姓名</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-center">狀態</th>
                {isConsultant && <th className="px-4 py-2 text-center">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrolled.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{e.full_name ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{e.email}</td>
                  <td className="px-4 py-2 text-center">
                    {e.status === 'completed' ? (
                      <span className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5 bg-green-100 text-green-700">
                        已完成
                        {e.score != null && <span className="font-medium">{e.score}分</span>}
                      </span>
                    ) : (
                      <span className="text-xs rounded-full px-2 py-0.5 bg-amber-100 text-amber-700">
                        未填寫
                      </span>
                    )}
                  </td>
                  {isConsultant && (
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleRemove(e.employee_id, e.full_name)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        移除
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">尚未加入學員</p>
          {isConsultant && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-sm text-indigo-500 hover:text-indigo-700"
            >
              + 新增學員
            </button>
          )}
        </div>
      )}

      {/* Add students modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">新增學員</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {courseType === 'enterprise' ? '從企業員工中選擇' : '從學員資料庫選擇'}
              </p>
            </div>

            {/* Search */}
            <div className="px-5 pt-3">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜尋學員姓名或 Email..."
                autoFocus
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
            </div>

            {/* Student list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
              {filteredAvailable.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  {search ? '找不到符合的學員' : '沒有可選擇的學員'}
                </p>
              ) : (
                <div className="space-y-1">
                  {filteredAvailable.map(s => {
                    const checked = selected.has(s.id)
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 ${checked ? 'bg-indigo-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(s.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{s.full_name ?? '未命名'}</p>
                          <p className="text-xs text-gray-400 truncate">{s.email}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {selected.size > 0 && `已選 ${selected.size} 位`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowModal(false); setSelected(new Set()); setSearch('') }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={selected.size === 0 || submitting}
                  className="text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-1.5 disabled:opacity-50"
                >
                  {submitting ? '處理中...' : `加入 ${selected.size} 位學員`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
