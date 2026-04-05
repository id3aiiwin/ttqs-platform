'use client'

import { useState } from 'react'
import { Card, CardBody } from '@/components/ui/card'

/* ---------- types ---------- */

interface CourseEnrollment {
  id: string
  course_id: string
  status: string
  completion_date: string | null
  created_at: string
  course_title: string
  course_type: string
  hours: number | null
}

interface QuizAttempt {
  id: string
  quiz_id: string
  score: number | null
  total: number | null
  percentage: number | null
  passed: boolean
  completed_at: string
  answers: unknown[]
  quiz_title: string
}

interface UserLicense {
  id: string
  product_id: string
  purchased_at: string
  product_title: string
  product_type: string
}

interface TimelineEvent {
  id: string
  date: string
  type: 'course' | 'quiz' | 'purchase'
  title: string
  detail: string
}

interface Props {
  basicInfoContent: React.ReactNode
  enrollments: CourseEnrollment[]
  quizAttempts: QuizAttempt[]
  licenses: UserLicense[]
}

/* ---------- helpers ---------- */

const TABS = [
  { id: 'basic', label: '基本資料' },
  { id: 'timeline', label: '學習履歷' },
  { id: 'quiz', label: '測驗紀錄' },
] as const

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${formatDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const STATUS_LABELS: Record<string, string> = {
  enrolled: '已報名',
  in_progress: '進行中',
  completed: '已完成',
  cancelled: '已取消',
}

const COURSE_TYPE_LABELS: Record<string, string> = {
  internal: '內訓',
  external: '外訓',
  online: '線上',
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  course: '課程',
  quiz: '測驗',
  ebook: '電子書',
}

function scoreColor(pct: number | null) {
  if (pct === null) return 'text-gray-400'
  if (pct >= 80) return 'text-green-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBg(pct: number | null) {
  if (pct === null) return 'bg-gray-100'
  if (pct >= 80) return 'bg-green-50'
  if (pct >= 60) return 'bg-amber-50'
  return 'bg-red-50'
}

/* ---------- component ---------- */

export function ProfileTabs({ basicInfoContent, enrollments, quizAttempts, licenses }: Props) {
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)

  /* Build timeline events */
  const events: TimelineEvent[] = [
    ...enrollments.map(e => ({
      id: `course-${e.id}`,
      date: e.completion_date ?? e.created_at,
      type: 'course' as const,
      title: e.course_title,
      detail: `${COURSE_TYPE_LABELS[e.course_type] ?? e.course_type} · ${STATUS_LABELS[e.status] ?? e.status}${e.hours ? ` · ${e.hours} 小時` : ''}`,
    })),
    ...quizAttempts.map(a => ({
      id: `quiz-${a.id}`,
      date: a.completed_at,
      type: 'quiz' as const,
      title: a.quiz_title,
      detail: `得分 ${a.percentage ?? 0}%${a.passed ? ' · 通過' : ' · 未通過'}`,
    })),
    ...licenses.map(l => ({
      id: `license-${l.id}`,
      date: l.purchased_at,
      type: 'purchase' as const,
      title: l.product_title,
      detail: `購買${PRODUCT_TYPE_LABELS[l.product_type] ?? l.product_type}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const dotColor = { course: 'bg-blue-500', quiz: 'bg-green-500', purchase: 'bg-purple-500' }
  const iconLabel = { course: '課', quiz: '測', purchase: '購' }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic info tab */}
      <div className={activeTab === 'basic' ? '' : 'hidden'}>
        {basicInfoContent}
      </div>

      {/* Learning timeline tab */}
      <div className={activeTab === 'timeline' ? '' : 'hidden'}>
        {events.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-gray-400 text-center py-8">尚無學習紀錄</p>
            </CardBody>
          </Card>
        ) : (
          <div className="relative pl-8">
            {/* Vertical line */}
            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200" />

            {events.map((event, idx) => (
              <div key={event.id} className={`relative pb-6 ${idx === events.length - 1 ? 'pb-0' : ''}`}>
                {/* Dot */}
                <div className={`absolute -left-5 top-1 w-6 h-6 rounded-full ${dotColor[event.type]} flex items-center justify-center`}>
                  <span className="text-[10px] font-bold text-white">{iconLabel[event.type]}</span>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 ml-4">
                  <p className="text-xs text-gray-400 mb-1">{formatDate(event.date)}</p>
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz history tab */}
      <div className={activeTab === 'quiz' ? '' : 'hidden'}>
        {quizAttempts.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-sm text-gray-400 text-center py-8">尚無測驗紀錄</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {quizAttempts
              .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
              .map(attempt => {
                const isExpanded = expandedAttempt === attempt.id
                return (
                  <div key={attempt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                      className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{attempt.quiz_title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(attempt.completed_at)}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${scoreBg(attempt.percentage)} ${scoreColor(attempt.percentage)}`}>
                            {attempt.percentage !== null ? `${attempt.percentage}%` : '--'}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            attempt.passed ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {attempt.passed ? '通過' : '未通過'}
                          </span>
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        <span>答對 {attempt.score ?? 0} / {attempt.total ?? 0} 題</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        <p className="text-xs font-medium text-gray-500 mb-3">作答詳情</p>
                        {Array.isArray(attempt.answers) && attempt.answers.length > 0 ? (
                          <div className="space-y-2">
                            {(attempt.answers as { question?: string; selected?: string; correct?: string; is_correct?: boolean }[]).map((ans, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <span className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] ${
                                  ans.is_correct ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                  {ans.is_correct ? 'O' : 'X'}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-gray-700">{ans.question ?? `題目 ${i + 1}`}</p>
                                  <p className="text-gray-400 mt-0.5">
                                    你的答案: {String(ans.selected ?? '--')}
                                    {!ans.is_correct && ` / 正確答案: ${String(ans.correct ?? '--')}`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">無詳細作答紀錄</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
