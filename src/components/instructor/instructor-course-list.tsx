'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'

interface Material {
  id: string
  material_type: string
  file_name: string
  file_url: string
  uploaded_at: string
}

interface CourseItem {
  id: string
  title: string
  status: string
  start_date: string | null
  end_date: string | null
  hours: number | null
  company_name: string
  material_submit_date: string | null
  teaching_log_submit_date: string | null
  materials: Material[]
}

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  draft: { label: '草稿', variant: 'default' },
  planned: { label: '已規劃', variant: 'info' },
  in_progress: { label: '進行中', variant: 'warning' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
}

const TYPE_LABELS: Record<string, string> = {
  lesson_plan: '教案',
  presentation: '簡報',
  teaching_log: '教學日誌',
}

function getDeadlineStatus(course: CourseItem, type: 'material' | 'log') {
  const now = new Date()
  const startDate = course.start_date ? new Date(course.start_date) : null
  if (!startDate) return null

  if (type === 'material') {
    const deadline = new Date(startDate)
    deadline.setDate(deadline.getDate() - 30)
    const submitted = course.material_submit_date
    if (submitted) return { status: 'done' as const, label: '已繳交' }
    if (now > deadline) return { status: 'overdue' as const, label: '已逾期' }
    const days = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { status: 'pending' as const, label: `剩 ${days} 天` }
  } else {
    const deadline = new Date(startDate)
    deadline.setDate(deadline.getDate() + 3)
    const submitted = course.teaching_log_submit_date
    if (submitted) return { status: 'done' as const, label: '已繳交' }
    if (now < startDate) return { status: 'not_yet' as const, label: '課程未開始' }
    if (now > deadline) return { status: 'overdue' as const, label: '已逾期' }
    const days = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { status: 'pending' as const, label: `剩 ${days} 天` }
  }
}

function DeadlineBadge({ info }: { info: ReturnType<typeof getDeadlineStatus> }) {
  if (!info) return <span className="text-xs text-gray-400">未設定日期</span>
  const colors = {
    done: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
    not_yet: 'bg-gray-100 text-gray-500',
  }
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[info.status]}`}>{info.label}</span>
}

export function InstructorCourseList({ courses }: { courses: CourseItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (courses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">目前沒有授課課程</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {courses.map(course => {
        const isExpanded = expandedId === course.id
        const status = STATUS_LABEL[course.status] ?? STATUS_LABEL.draft
        const materialDeadline = getDeadlineStatus(course, 'material')
        const logDeadline = getDeadlineStatus(course, 'log')

        return (
          <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Course header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : course.id)}
              className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <span className="text-xs text-gray-400">{course.company_name}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                  {course.start_date && <span>{course.start_date}</span>}
                  {course.hours && <span>{course.hours}h</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                {/* 繳交狀態摘要 */}
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">教案</span>
                    <DeadlineBadge info={materialDeadline} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">日誌</span>
                    <DeadlineBadge info={logDeadline} />
                  </div>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded: upload area */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <UploadSlot
                    courseId={course.id}
                    type="lesson_plan"
                    label="教案"
                    accept=".doc,.docx,.pdf"
                    existing={course.materials.filter(m => m.material_type === 'lesson_plan')}
                    deadline={materialDeadline}
                  />
                  <UploadSlot
                    courseId={course.id}
                    type="presentation"
                    label="簡報"
                    accept=".ppt,.pptx,.pdf"
                    existing={course.materials.filter(m => m.material_type === 'presentation')}
                    deadline={materialDeadline}
                  />
                  <UploadSlot
                    courseId={course.id}
                    type="teaching_log"
                    label="教學日誌"
                    accept=".doc,.docx,.pdf"
                    existing={course.materials.filter(m => m.material_type === 'teaching_log')}
                    deadline={logDeadline}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function UploadSlot({
  courseId,
  type,
  label,
  accept,
  existing,
  deadline,
}: {
  courseId: string
  type: string
  label: string
  accept: string
  existing: Material[]
  deadline: ReturnType<typeof getDeadlineStatus>
}) {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<Material[]>(existing)
  const [error, setError] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('course_id', courseId)
    formData.append('material_type', type)

    try {
      const res = await fetch('/api/course-materials', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.ok) {
        setFiles(prev => [{
          id: crypto.randomUUID(),
          material_type: type,
          file_name: data.fileName,
          file_url: data.url,
          uploaded_at: new Date().toISOString(),
        }, ...prev])
      } else {
        setError(data.error || '上傳失敗')
      }
    } catch {
      setError('網路錯誤')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch('/api/course-materials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setFiles(prev => prev.filter(f => f.id !== id))
    } catch { /* ignore */ }
  }

  const hasFiles = files.length > 0

  return (
    <div className={`rounded-xl border p-4 ${hasFiles ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {deadline && <DeadlineBadge info={deadline} />}
      </div>

      {/* 已上傳的檔案 */}
      {files.map(f => (
        <div key={f.id} className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2 mb-2">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <a href={f.file_url} target="_blank" rel="noopener" className="text-xs text-indigo-600 hover:underline truncate flex-1">
            {f.file_name}
          </a>
          <button onClick={() => handleDelete(f.id)} className="text-gray-300 hover:text-red-500 flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {/* 上傳按鈕 */}
      <label className={`flex items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-3 cursor-pointer transition-colors
        ${uploading ? 'border-gray-200 bg-gray-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50'}`}
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">上傳中...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs text-gray-500">{hasFiles ? '重新上傳' : '選擇檔案'}</span>
          </>
        )}
        <input type="file" accept={accept} onChange={handleUpload} className="hidden" disabled={uploading} />
      </label>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
