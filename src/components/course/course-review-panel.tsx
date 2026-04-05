'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface Props {
  courseId: string
  courseTitle: string
  trainer: string | null
  hours: number | null
  startDate: string | null
  materialSubmitDate: string | null
  teachingLogSubmitDate: string | null
  reviewStatus: string
  satisfactionStats?: { learning_effect_avg?: number; course_avg?: number; instructor_avg?: number; overall_avg?: number } | null
  openAnswers?: { q1?: string; q2?: string; q3?: string; q4?: string }[]
  isConsultant: boolean
}

export function CourseReviewPanel({
  courseId, courseTitle, trainer, hours, startDate,
  materialSubmitDate, teachingLogSubmitDate, reviewStatus,
  satisfactionStats, openAnswers, isConsultant,
}: Props) {
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const courseDate = startDate ? new Date(startDate) : null

  function checkMaterial(): { ok: boolean; text: string } | null {
    if (!materialSubmitDate || !courseDate) return null
    const submit = new Date(materialSubmitDate)
    const deadline = new Date(courseDate); deadline.setDate(deadline.getDate() - 30)
    return submit <= deadline
      ? { ok: true, text: `✅ ${materialSubmitDate}（一個月前繳交）` }
      : { ok: false, text: `⚠️ ${materialSubmitDate}（逾期繳交）` }
  }

  function checkLog(): { ok: boolean; text: string } | null {
    if (!teachingLogSubmitDate || !courseDate) return null
    const submit = new Date(teachingLogSubmitDate)
    const deadline = new Date(courseDate); deadline.setDate(deadline.getDate() + 2)
    return submit <= deadline
      ? { ok: true, text: `✅ ${teachingLogSubmitDate}（2天內繳交）` }
      : { ok: false, text: `⚠️ ${teachingLogSubmitDate}（逾期繳交）` }
  }

  async function handleApprove() {
    if (!confirm('確定核准此課程？將計入講師時數。')) return
    startTransition(async () => {
      // 更新課程
      await fetch('/api/course-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, action: 'approve', trainer, hours }),
      })
      router.refresh()
    })
  }

  async function handleReject() {
    if (!rejectReason.trim()) { alert('請填寫退回原因'); return }
    startTransition(async () => {
      await fetch('/api/course-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, action: 'reject', reject_reason: rejectReason }),
      })
      setShowReject(false)
      router.refresh()
    })
  }

  const mat = checkMaterial()
  const log = checkLog()
  const sat = satisfactionStats

  return (
    <div className="space-y-4">
      {/* 審核狀態 */}
      <div className="flex items-center gap-3">
        <Badge variant={reviewStatus === 'approved' ? 'success' : reviewStatus === 'rejected' ? 'danger' : 'warning'}>
          {reviewStatus === 'approved' ? '已核准' : reviewStatus === 'rejected' ? '已退回' : '待審核'}
        </Badge>
        {reviewStatus === 'approved' && <span className="text-xs text-green-600">已計入講師時數</span>}
      </div>

      {/* 審核資訊面板 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 教材繳交 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">簡報教案繳交</p>
          {mat ? <p className={`text-sm ${mat.ok ? 'text-green-600' : 'text-amber-600'}`}>{mat.text}</p> : <p className="text-sm text-gray-400">尚未繳交</p>}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">授課日誌繳交</p>
          {log ? <p className={`text-sm ${log.ok ? 'text-green-600' : 'text-amber-600'}`}>{log.text}</p> : <p className="text-sm text-gray-400">尚未繳交</p>}
        </div>
      </div>

      {/* 滿意度分數 */}
      {sat && (sat.learning_effect_avg || sat.course_avg || sat.instructor_avg) ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">滿意度分數</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '學習效果', value: sat.learning_effect_avg },
              { label: '課程評價', value: sat.course_avg },
              { label: '講師評價', value: sat.instructor_avg },
              { label: '綜合平均', value: sat.overall_avg },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className={`text-xl font-bold ${(s.value ?? 0) >= 90 ? 'text-green-600' : (s.value ?? 0) >= 80 ? 'text-indigo-600' : (s.value ?? 0) >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                  {s.value ?? '—'}
                </p>
                <p className="text-[10px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-3">尚無滿意度資料</p>
      )}

      {/* 開放性留言 */}
      {openAnswers && openAnswers.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">學員開放性回饋</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {openAnswers.map((a, i) => (
              <div key={i} className="text-xs text-gray-600 bg-white rounded p-2 border border-gray-200">
                {a.q1 && <p><strong>學到什麼：</strong>{a.q1}</p>}
                {a.q2 && <p><strong>發現什麼：</strong>{a.q2}</p>}
                {a.q3 && <p><strong>如何應用：</strong>{a.q3}</p>}
                {a.q4 && <p><strong>其他問題：</strong>{a.q4}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 審核按鈕 */}
      {isConsultant && reviewStatus === 'pending' && (
        <div>
          {showReject ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="請輸入退回原因..." rows={2} className="w-full text-sm border border-red-300 rounded px-2 py-1.5" autoFocus />
              <div className="flex gap-2">
                <button onClick={handleReject} disabled={pending}
                  className="text-xs text-white bg-red-600 hover:bg-red-700 rounded px-3 py-1.5 disabled:opacity-50">確定退回</button>
                <button onClick={() => setShowReject(false)} className="text-xs text-gray-400 px-2">取消</button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleApprove} disabled={pending}
                className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                {pending ? '處理中...' : '核准（計入時數）'}
              </button>
              <button onClick={() => setShowReject(true)}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                退回
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
