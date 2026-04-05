'use client'

import { useState, useTransition } from 'react'
import { updateFormStatus, updateFormName, deleteCourseForm } from '@/app/(dashboard)/courses/form-actions'
import { FORM_TYPE_LABELS, FORM_STATUS_LABELS } from '@/lib/pddro-defaults'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CourseForm } from '@/types/database'

interface PddroFormItemProps {
  form: CourseForm
  courseId: string
  isConsultant: boolean
}

export function PddroFormItem({ form, courseId, isConsultant }: PddroFormItemProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(form.name)
  const [showAttendees, setShowAttendees] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const typeInfo = FORM_TYPE_LABELS[form.form_type]

  const nextStatus = form.status === 'pending'
    ? 'in_progress'
    : form.status === 'in_progress'
    ? 'completed'
    : 'pending'

  function handleStatusChange() {
    startTransition(async () => {
      await updateFormStatus(form.id, nextStatus, courseId)
      router.refresh()
    })
  }

  function handleSaveName() {
    if (name.trim() && name !== form.name) {
      startTransition(async () => {
        await updateFormName(form.id, name.trim(), courseId)
        router.refresh()
      })
    }
    setEditing(false)
  }

  function handleDelete() {
    if (!confirm(`確定刪除「${form.name}」？`)) return
    startTransition(async () => {
      await deleteCourseForm(form.id, courseId)
      router.refresh()
    })
  }

  // 可線上填寫的表單（有 field_schema 或有系統預設 schema）
  const hasOnlineForm = form.form_type === 'online' || form.field_schema != null

  // 簽到表資料
  const isSignForm = form.standard_name === '訓練活動紀錄簽到表'
  const formData = form.form_data as { attendees?: { name: string; birthday?: string; email?: string; sign_time?: string; employee_id?: string | null }[] } | null
  const attendees = formData?.attendees ?? []

  return (
    <div>
      <div className="mx-5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group flex items-center gap-3">
        {/* TTQS 指標 */}
        {form.ttqs_indicator && (
          <span className="flex-shrink-0 text-xs font-mono text-gray-400 w-8 text-right">
            {form.ttqs_indicator}
          </span>
        )}

        {/* Status checkbox */}
        <button onClick={handleStatusChange} disabled={pending} className="flex-shrink-0"
          title={`切換為：${FORM_STATUS_LABELS[nextStatus]?.label}`}>
          {form.status === 'completed' ? (
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : form.status === 'in_progress' ? (
            <div className="w-5 h-5 rounded-full border-2 border-yellow-400 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
          )}
        </button>

        {/* Name */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input value={name} onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="text-sm w-full border border-gray-300 rounded px-2 py-0.5 focus:outline-none focus:border-indigo-500" autoFocus />
          ) : (
            <div className="flex items-center gap-2">
              {hasOnlineForm ? (
                <Link
                  href={`/courses/${courseId}/forms/${form.id}`}
                  className={`text-sm truncate hover:text-indigo-600 transition-colors ${form.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}
                  onDoubleClick={(e) => { if (isConsultant) { e.preventDefault(); setEditing(true) } }}
                >
                  {form.name}
                </Link>
              ) : (
                <p className={`text-sm truncate ${form.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}
                  onDoubleClick={() => isConsultant && setEditing(true)}>
                  {form.name}
                </p>
              )}
              {/* 簽到表：查看簽到名單按鈕 */}
              {isSignForm && attendees.length > 0 && (
                <button onClick={() => setShowAttendees(!showAttendees)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 whitespace-nowrap">
                  簽到 {attendees.length} 人
                </button>
              )}
            </div>
          )}
        </div>

        {/* Type badge */}
        <span className={`flex-shrink-0 inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs ${typeInfo.color}`}>
          <span>{typeInfo.icon}</span>
          {typeInfo.label}
        </span>

        {/* Delete */}
        {isConsultant && (
          <button onClick={handleDelete}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all" title="刪除">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 簽到名單展開 */}
      {isSignForm && showAttendees && attendees.length > 0 && (
        <div className="mx-5 mb-2 ml-16 bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">簽到名單（{attendees.length} 人）</p>
          <div className="flex flex-col gap-1">
            {attendees.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-indigo-700">{a.name.charAt(0)}</span>
                </div>
                <span className="text-gray-900 flex-1">{a.name}</span>
                {a.sign_time && (
                  <span className="text-xs text-gray-400">
                    {new Date(a.sign_time).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                {a.employee_id ? (
                  <span className="text-xs text-green-500">已連結帳號</span>
                ) : (
                  <span className="text-xs text-gray-400">無帳號</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
