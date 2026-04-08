'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { PddroFormSection } from './pddro-form-section'
import { CoursePhotos } from './course-photos'
import { SurveyManager } from '@/components/survey/survey-manager'
import { AiSurveyAnalysis } from '@/components/survey/ai-survey-analysis'
import { CourseNotes } from './course-notes'
import { LineNotifyButton } from './line-notify-button'
import { CourseTracking } from './course-tracking'
import { CourseRegistrations } from './course-registrations'
import { SatisfactionInput } from '@/components/survey/satisfaction-input'
import { CourseAdminTools } from './course-admin-tools'
import { CourseEnrollmentManager } from './course-enrollment-manager'
import { CourseReviewPanel } from './course-review-panel'
import { LineInstructorNotify } from './line-instructor-notify'
import { CourseDetailTabs } from './course-detail-tabs'
import { DuplicateCourseButton } from './duplicate-course-button'
import { LineBindQRCode } from './line-bind-qrcode'
import type { Course, CourseForm, UserRole } from '@/types/database'

const STATUS_LABEL: Record<string, { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  draft:       { label: '草稿',   variant: 'default' },
  planned:     { label: '已規劃', variant: 'info'    },
  in_progress: { label: '進行中', variant: 'warning' },
  completed:   { label: '已完成', variant: 'success' },
  cancelled:   { label: '已取消', variant: 'danger'  },
}

interface Photo { id: string; file_url: string; created_at: string }

interface SurveyData { id: string; is_active: boolean }

interface NoteData { id: string; author_name: string | null; note_type: string; content: string; employee_id: string | null; employee_name: string | null; created_at: string }

interface CourseDetailPanelProps {
  course: (Course & { company_name?: string }) | null
  forms: CourseForm[] | null
  photos: Photo[]
  notes?: NoteData[]
  tracking?: Record<string, unknown>[]
  registrations?: { id: string; student_name: string | null; student_email: string | null; student_phone: string | null; fee: number; payment_status: string; payment_date: string | null; account_last5: string | null }[]
  courseEmployees?: { id: string; name: string }[]
  survey: SurveyData | null
  surveyResponseCount: number
  role: UserRole
  companyId: string
}

export function CourseDetailPanel({ course, forms, photos, notes, tracking, registrations, courseEmployees, survey, surveyResponseCount, role, companyId }: CourseDetailPanelProps) {
  if (!course) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-400 text-sm">選擇左側課程查看詳情</p>
        </div>
      </div>
    )
  }

  const status = STATUS_LABEL[course.status] ?? STATUS_LABEL.draft
  const isConsultant = role === 'consultant'

  // 依構面分組表單
  const phases = ['P', 'D', 'DO', 'R', 'O'] as const
  const formsByPhase: Record<string, CourseForm[]> = {}
  phases.forEach((p) => { formsByPhase[p] = [] })
  forms?.forEach((f) => {
    if (!formsByPhase[f.pddro_phase]) formsByPhase[f.pddro_phase] = []
    formsByPhase[f.pddro_phase].push(f)
  })

  // 進度統計
  const totalForms = forms?.length ?? 0
  const completedForms = forms?.filter((f) => f.status === 'completed').length ?? 0
  const progressPct = totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{course.title}</h1>
              {'company_name' in course && course.company_name && (
                <p className="text-sm text-gray-500 mt-1">{course.company_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isConsultant && (
                <button
                  onClick={() => window.open(`/api/export?type=course_students&course_id=${course.id}`, '_blank')}
                  className="text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  匯出學員資料
                </button>
              )}
              {(isConsultant || role === 'admin') && (
                <LineBindQRCode
                  courseId={course.id}
                  label={`讓「${course.title}」的學員掃碼綁定 LINE`}
                />
              )}
              {isConsultant && (
                <LineNotifyButton
                  courseId={course.id}
                  courseTitle={course.title}
                  startDate={course.start_date}
                  hours={course.hours}
                  trainer={course.trainer}
                />
              )}
              {isConsultant && (
                <DuplicateCourseButton courseId={course.id} />
              )}
              {isConsultant && (
                <Link
                  href={`/courses/${course.id}/edit`}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 rounded-lg px-3 py-1.5"
                >
                  編輯
                </Link>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">講師</p>
              <p className="text-gray-700">{course.trainer ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">時數</p>
              <p className="text-gray-700">{course.hours ? `${course.hours}h` : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">開始日期</p>
              <p className="text-gray-700">{course.start_date ?? '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">預算</p>
              <p className="text-gray-700">{course.budget ? `NT$ ${Number(course.budget).toLocaleString()}` : '-'}</p>
            </div>
          </div>

          {course.description && (
            <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{course.description}</p>
          )}
        </div>

        {/* 摘要卡片 + 分頁標籤 */}
        <CourseDetailTabs
          tabs={[
            { id: 'students', label: '學員', visible: isConsultant || role === 'admin' },
            { id: 'forms', label: 'PDDRO 表單', visible: true },
            { id: 'media', label: '照片', visible: true },
            { id: 'survey', label: '問卷 / 滿意度', visible: true },
            { id: 'tracking', label: '執行追蹤', visible: isConsultant },
            { id: 'review', label: '審核 / 行政', visible: isConsultant },
          ]}
          summaryCards={
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-400">學員數</p>
                <p className="text-lg font-bold text-gray-900">{registrations?.length ?? 0}</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-400">表單進度</p>
                <p className="text-lg font-bold text-indigo-600">{progressPct}%</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-400">審核狀態</p>
                <Badge variant={course.review_status === 'approved' ? 'success' : course.review_status === 'rejected' ? 'danger' : 'warning'}>
                  {course.review_status === 'approved' ? '已核准' : course.review_status === 'rejected' ? '退回' : '待審'}
                </Badge>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-400">狀態</p>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          }
        >
          {{
            students: (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <CourseEnrollmentManager
                    courseId={course.id}
                    companyId={companyId}
                    courseType={course.course_type ?? 'enterprise'}
                    isConsultant={isConsultant}
                  />
                </div>
                {course.course_type === 'public' && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-semibold text-gray-900 mb-3">學員報名 / 匯款追蹤</h2>
                    <CourseRegistrations
                      courseId={course.id}
                      registrations={registrations ?? []}
                      defaultFee={course.default_fee}
                      isConsultant={isConsultant || role === 'admin'}
                    />
                  </div>
                )}
              </div>
            ),

            forms: (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">PDDRO 表單清單</h2>
                  {totalForms > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {completedForms} / {totalForms} 完成（{progressPct}%）
                    </p>
                  )}
                </div>
                {totalForms > 0 && (
                  <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                )}
                {totalForms === 0 ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-sm text-gray-400">尚無表單資料</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {phases.map((p) => {
                      const phaseForms = formsByPhase[p]
                      if (!phaseForms || phaseForms.length === 0) return null
                      return (
                        <PddroFormSection key={p} phase={p} forms={phaseForms} courseId={course.id} isConsultant={isConsultant} />
                      )
                    })}
                  </div>
                )}
              </div>
            ),

            media: (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <CoursePhotos courseId={course.id} companyId={companyId} photos={photos} />
              </div>
            ),

            survey: (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-semibold text-gray-900 mb-3">課後問卷</h2>
                  <SurveyManager courseId={course.id} companyId={companyId} survey={survey} responseCount={surveyResponseCount} />
                </div>
                {isConsultant && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-semibold text-gray-900 mb-3">滿意度回填</h2>
                    <SatisfactionInput courseId={course.id} courseName={course.title} isEnterprise={course.course_type === 'enterprise'} />
                  </div>
                )}
                {survey && surveyResponseCount > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h2 className="font-semibold text-gray-900 mb-3">滿意度統計分析</h2>
                    <AiSurveyAnalysis courseId={course.id} courseTitle={course.title} isConsultant={role === 'consultant'} />
                  </div>
                )}
              </div>
            ),

            tracking: (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-blue-200 p-5">
                  <h2 className="font-semibold text-gray-900 mb-3">課程訓練狀況</h2>
                  <CourseTracking
                    courseId={course.id}
                    records={(tracking ?? []) as { id: string; tracking_date: string; expected_count: number | null; actual_count: number | null; absent_list: { name: string; reason: string }[]; schedule_status: string; equipment_ok: boolean; equipment_note: string | null; engagement_level: string; engagement_note: string | null; has_incident: boolean; incident_desc: string | null; incident_action: string | null; photo_count: number; summary: string | null; recorded_by_name: string | null }[]}
                    isConsultant={true}
                  />
                </div>
                <div className="bg-white rounded-xl border border-amber-200 p-5">
                  <h2 className="font-semibold text-gray-900 mb-3">課程執行紀錄</h2>
                  <CourseNotes courseId={course.id} notes={notes ?? []} isConsultant={true} employees={courseEmployees} />
                </div>
              </div>
            ),

            review: (
              <div className="space-y-5">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-semibold text-gray-900 mb-3">課程審核</h2>
                  <CourseReviewPanel
                    courseId={course.id}
                    courseTitle={course.title}
                    trainer={course.trainer}
                    hours={course.hours}
                    startDate={course.start_date}
                    materialSubmitDate={course.material_submit_date}
                    teachingLogSubmitDate={course.teaching_log_submit_date}
                    reviewStatus={course.review_status ?? 'pending'}
                    isConsultant={true}
                  />
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-semibold text-gray-900 mb-3">教材追蹤 / 行政檢核</h2>
                  <CourseAdminTools
                    courseId={course.id}
                    startDate={course.start_date}
                    materialSubmitDate={course.material_submit_date}
                    teachingLogSubmitDate={course.teaching_log_submit_date}
                    checklist={null}
                  />
                  {course.trainer && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <LineInstructorNotify
                        courseId={course.id}
                        courseTitle={course.title}
                        startDate={course.start_date}
                        trainerName={course.trainer}
                        surveyId={survey?.id ?? null}
                      />
                    </div>
                  )}
                </div>
              </div>
            ),
          }}
        </CourseDetailTabs>
      </div>
    </div>
  )
}
