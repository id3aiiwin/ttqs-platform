'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  courseId: string
  startDate: string | null
  materialSubmitDate: string | null
  teachingLogSubmitDate: string | null
  checklist: { items: string[]; checked: Record<string, boolean> } | null
}

const DEFAULT_CHECKLIST = ['講義', '簽到表', '教案', '課後問卷']

export function CourseAdminTools({ courseId, startDate, materialSubmitDate, teachingLogSubmitDate, checklist }: Props) {
  const [materialDate, setMaterialDate] = useState(materialSubmitDate ?? '')
  const [logDate, setLogDate] = useState(teachingLogSubmitDate ?? '')
  const [items] = useState(checklist?.items ?? DEFAULT_CHECKLIST)
  const [checked, setChecked] = useState<Record<string, boolean>>(checklist?.checked ?? {})
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // 教材追蹤計算
  const courseDate = startDate ? new Date(startDate) : null
  const today = new Date()

  function checkMaterialDeadline(): { status: string; color: string } | null {
    if (!materialDate || !courseDate) return null
    const submitDate = new Date(materialDate)
    const deadline = new Date(courseDate)
    deadline.setDate(deadline.getDate() - 30)
    if (submitDate <= deadline) return { status: '✅ 一個月前繳交', color: 'text-green-600' }
    return { status: '⚠️ 逾期繳交', color: 'text-amber-600' }
  }

  function checkLogDeadline(): { status: string; color: string } | null {
    if (!logDate || !courseDate) return null
    const submitDate = new Date(logDate)
    const deadline = new Date(courseDate)
    deadline.setDate(deadline.getDate() + 2)
    if (submitDate <= deadline) return { status: '✅ 2天內繳交', color: 'text-green-600' }
    return { status: '⚠️ 逾期繳交', color: 'text-amber-600' }
  }

  function handleSave() {
    startTransition(async () => {
      // 儲存教材日期
      await fetch('/api/course-admin-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          material_submit_date: materialDate || null,
          teaching_log_submit_date: logDate || null,
          checklist_items: items,
          checklist_checked: checked,
        }),
      })
      router.refresh()
    })
  }

  const materialCheck = checkMaterialDeadline()
  const logCheck = checkLogDeadline()
  const checkedCount = Object.values(checked).filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* 教材繳交追蹤 */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">教材繳交追蹤</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400">簡報教案繳交日期</label>
            <div className="flex items-center gap-2">
              <input type="date" value={materialDate} onChange={e => setMaterialDate(e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5" />
              {materialCheck && <span className={`text-xs font-medium ${materialCheck.color}`}>{materialCheck.status}</span>}
            </div>
            {courseDate && <p className="text-[10px] text-gray-400 mt-0.5">開課日 {startDate}，需於 30 天前繳交</p>}
          </div>
          <div>
            <label className="text-xs text-gray-400">授課日誌繳交日期</label>
            <div className="flex items-center gap-2">
              <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1.5" />
              {logCheck && <span className={`text-xs font-medium ${logCheck.color}`}>{logCheck.status}</span>}
            </div>
            {courseDate && <p className="text-[10px] text-gray-400 mt-0.5">開課日 {startDate}，需於 2 天內繳交</p>}
          </div>
        </div>
      </div>

      {/* 行政檢核 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">行政檢核</p>
          <span className="text-xs text-gray-400">{checkedCount}/{items.length} 完成</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map(item => (
            <label key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              checked[item] ? 'bg-green-50 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}>
              <input type="checkbox" checked={!!checked[item]}
                onChange={e => setChecked({ ...checked, [item]: e.target.checked })}
                className="rounded text-green-600 focus:ring-green-500" />
              <span className="text-sm">{item}</span>
            </label>
          ))}
        </div>
      </div>

      <button onClick={handleSave} disabled={pending}
        className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded px-4 py-1.5 disabled:opacity-50">
        {pending ? '儲存中...' : '儲存'}
      </button>
    </div>
  )
}
