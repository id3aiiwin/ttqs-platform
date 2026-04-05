'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface Course {
  id: string
  title: string
  status: string
  start_date: string | null
  hours: number | null
  trainer: string | null
  company_id: string | null
  review_status: string
  material_submit_date: string | null
  created_at: string
}

interface Satisfaction {
  le: number; ce: number; ie: number; ve: number; overall: number; count: number
}

interface Props {
  pending: Course[]
  recent: Course[]
  companyMap: Record<string, string>
  satisfactionMap: Record<string, Satisfaction>
}

function scoreColor(score: number): string {
  if (score >= 4.5) return 'text-green-600'
  if (score >= 3.5) return 'text-blue-600'
  if (score >= 2.5) return 'text-amber-600'
  return 'text-red-600'
}

function isMaterialOverdue(startDate: string | null, submitDate: string | null): 'on_time' | 'overdue' | 'not_submitted' | 'no_date' {
  if (!startDate) return 'no_date'
  if (!submitDate) {
    const deadline = new Date(startDate)
    deadline.setDate(deadline.getDate() - 30)
    return new Date() > deadline ? 'overdue' : 'not_submitted'
  }
  const deadline = new Date(startDate)
  deadline.setDate(deadline.getDate() - 30)
  return new Date(submitDate) <= deadline ? 'on_time' : 'overdue'
}

export function CourseReviewClient({ pending, recent, companyMap, satisfactionMap }: Props) {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [pending2, startTransition] = useTransition()
  const router = useRouter()

  function handleApprove(courseId: string) {
    if (!confirm('確定核准此課程？核准後將計入講師時數。')) return
    startTransition(async () => {
      await fetch('/api/course-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, action: 'approve' }),
      })
      router.refresh()
    })
  }

  function handleReject(courseId: string) {
    if (!rejectReason.trim()) { alert('請填寫退回原因'); return }
    startTransition(async () => {
      await fetch('/api/course-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, action: 'reject', reason: rejectReason }),
      })
      setRejectingId(null)
      setRejectReason('')
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      {/* 待審核 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-gray-900">待審核</h2>
          {pending.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold rounded-full px-2 py-0.5">{pending.length}</span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            目前沒有待審核的課程
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">課程名稱</th>
                  <th className="px-4 py-3 text-left">企業</th>
                  <th className="px-4 py-3 text-left">講師</th>
                  <th className="px-4 py-3 text-right">時數</th>
                  <th className="px-4 py-3 text-left">教案繳交</th>
                  <th className="px-4 py-3 text-right">學習效果</th>
                  <th className="px-4 py-3 text-right">課程評價</th>
                  <th className="px-4 py-3 text-right">講師評價</th>
                  <th className="px-4 py-3 text-right">場地</th>
                  <th className="px-4 py-3 text-right">整體</th>
                  <th className="px-4 py-3 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map(c => {
                  const sat = satisfactionMap[c.id]
                  const materialStatus = isMaterialOverdue(c.start_date, c.material_submit_date)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{c.title}</p>
                        <p className="text-xs text-gray-400">{c.start_date ?? '未排期'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.company_id ? companyMap[c.company_id] ?? '—' : '公開課'}</td>
                      <td className="px-4 py-3 text-gray-700">{c.trainer ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{c.hours ? `${c.hours}h` : '—'}</td>
                      <td className="px-4 py-3">
                        {materialStatus === 'on_time' && (
                          <span className="text-xs text-green-600 font-medium">{c.material_submit_date}</span>
                        )}
                        {materialStatus === 'overdue' && (
                          <span className="text-xs text-red-600 font-medium">{c.material_submit_date ? `${c.material_submit_date} (逾期)` : '未繳交 (逾期)'}</span>
                        )}
                        {materialStatus === 'not_submitted' && <span className="text-xs text-gray-400">未繳交</span>}
                        {materialStatus === 'no_date' && <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sat ? <span className={`text-xs font-medium ${scoreColor(sat.le)}`}>{sat.le.toFixed(1)}</span> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sat ? <span className={`text-xs font-medium ${scoreColor(sat.ce)}`}>{sat.ce.toFixed(1)}</span> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sat ? <span className={`text-xs font-medium ${scoreColor(sat.ie)}`}>{sat.ie.toFixed(1)}</span> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sat ? <span className={`text-xs font-medium ${scoreColor(sat.ve)}`}>{sat.ve.toFixed(1)}</span> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {sat ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            sat.overall >= 4.5 ? 'bg-green-50 text-green-700' :
                            sat.overall >= 3.5 ? 'bg-blue-50 text-blue-700' :
                            sat.overall >= 2.5 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {sat.overall.toFixed(2)}
                            <span className="text-[10px] ml-0.5 opacity-60">({sat.count})</span>
                          </span>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {rejectingId === c.id ? (
                          <div className="flex items-center gap-2">
                            <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                              placeholder="退回原因..." className="text-xs border border-gray-300 rounded px-2 py-1 w-32" autoFocus />
                            <button onClick={() => handleReject(c.id)} disabled={pending2}
                              className="text-xs bg-red-600 text-white rounded px-2 py-1 hover:bg-red-700 disabled:opacity-50">確定</button>
                            <button onClick={() => { setRejectingId(null); setRejectReason('') }}
                              className="text-xs text-gray-400">取消</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleApprove(c.id)} disabled={pending2}
                              className="text-xs bg-green-600 text-white rounded-lg px-3 py-1.5 hover:bg-green-700 disabled:opacity-50">
                              核准
                            </button>
                            <button onClick={() => setRejectingId(c.id)} disabled={pending2}
                              className="text-xs bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-100 disabled:opacity-50">
                              不核准
                            </button>
                            <Link href={`/courses?selected=${c.id}`} className="text-xs text-gray-400 hover:text-indigo-600">
                              詳情
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 已審核 */}
      {recent.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">已審核</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">課程名稱</th>
                  <th className="px-4 py-3 text-left">企業</th>
                  <th className="px-4 py-3 text-left">講師</th>
                  <th className="px-4 py-3 text-right">時數</th>
                  <th className="px-4 py-3 text-right">整體滿意度</th>
                  <th className="px-4 py-3 text-center">審核結果</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recent.map(c => {
                  const sat = satisfactionMap[c.id]
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/courses?selected=${c.id}`} className="font-medium text-gray-900 hover:text-indigo-600">{c.title}</Link>
                        <p className="text-xs text-gray-400">{c.start_date ?? '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.company_id ? companyMap[c.company_id] ?? '—' : '公開課'}</td>
                      <td className="px-4 py-3 text-gray-700">{c.trainer ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{c.hours ? `${c.hours}h` : '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {sat ? <span className={`text-xs font-medium ${scoreColor(sat.overall)}`}>{sat.overall.toFixed(2)}</span> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={c.review_status === 'approved' ? 'success' : 'danger'}>
                          {c.review_status === 'approved' ? '已核准' : '已退回'}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
