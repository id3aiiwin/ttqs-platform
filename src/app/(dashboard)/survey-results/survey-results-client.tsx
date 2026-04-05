'use client'

import { useState, useMemo, Fragment } from 'react'
import Link from 'next/link'
import {
  LEARNING_EFFECT, COURSE_EVAL, INSTRUCTOR_EVAL, VENUE_EVAL,
  OPEN_QUESTIONS, SCORE_LABELS,
} from '@/lib/survey-questions'

interface SectionAvgs {
  learning: number
  course: number
  instructor: number
  venue: number
}

interface SurveyItem {
  id: string
  courseId: string
  isActive: boolean
  createdAt: string
  responseCount: number
  overallAvg: number
  sectionAvgs: SectionAvgs
  courseName: string
  courseDate: string | null
  trainer: string
  companyId: string
  companyName: string
  courseType: string
  courseStatus: string
}

interface RespondentResponse {
  surveyId: string
  courseName: string
  courseDate: string | null
  companyName: string
  overallAvg: number
  sectionAvgs: SectionAvgs
  scores: { le: number[]; ce: number[]; ie: number[]; ve: number[] }
  openAnswers: Record<string, string>
  futureCourses: string[]
  submittedAt: string | null
}

interface RespondentItem {
  id: string
  name: string
  surveyCount: number
  responses: RespondentResponse[]
}

interface Props {
  surveyData: SurveyItem[]
  respondentData: RespondentItem[]
  companyOptions: { id: string; name: string }[]
}

function scoreColor(score: number): string {
  if (score >= 4.5) return 'text-green-600'
  if (score >= 3.5) return 'text-blue-600'
  if (score >= 2.5) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBgColor(score: number): string {
  if (score >= 4.5) return 'bg-green-50 text-green-700'
  if (score >= 3.5) return 'bg-blue-50 text-blue-700'
  if (score >= 2.5) return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
  } catch {
    return dateStr
  }
}

export function SurveyResultsClient({ surveyData, respondentData, companyOptions }: Props) {
  const [tab, setTab] = useState<'surveys' | 'students'>('surveys')

  // Survey tab state
  const [companyFilter, setCompanyFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedSurvey, setExpandedSurvey] = useState<string | null>(null)

  // Student tab state
  const [studentSearch, setStudentSearch] = useState('')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [expandedResponse, setExpandedResponse] = useState<string | null>(null)

  // Filter surveys
  const filteredSurveys = useMemo(() => {
    return surveyData.filter(s => {
      if (companyFilter && s.companyId !== companyFilter) return false
      if (searchQuery && !s.courseName.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (dateFrom && s.courseDate && s.courseDate < dateFrom) return false
      if (dateTo && s.courseDate && s.courseDate > dateTo) return false
      return true
    })
  }, [surveyData, companyFilter, searchQuery, dateFrom, dateTo])

  // Stats
  const totalSurveys = surveyData.length
  const totalResponses = surveyData.reduce((s, v) => s + v.responseCount, 0)
  const avgSatisfaction = totalResponses > 0
    ? Math.round(surveyData.reduce((s, v) => s + v.overallAvg * v.responseCount, 0) / totalResponses * 100) / 100
    : 0

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthlyResponses = surveyData
    .filter(s => s.courseDate && s.courseDate.startsWith(thisMonth))
    .reduce((s, v) => s + v.responseCount, 0)

  // Filter students
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return respondentData
    return respondentData.filter(r =>
      r.name.toLowerCase().includes(studentSearch.toLowerCase())
    )
  }, [respondentData, studentSearch])

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('surveys')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'surveys' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          課程問卷
        </button>
        <button
          onClick={() => setTab('students')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'students' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          學員查詢
        </button>
      </div>

      {tab === 'surveys' && (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">總問卷數</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{totalSurveys}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">總回覆數</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalResponses}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">平均滿意度</p>
              <p className={`text-2xl font-bold mt-1 ${scoreColor(avgSatisfaction)}`}>
                {avgSatisfaction > 0 ? avgSatisfaction.toFixed(2) : '-'}
              </p>
              <p className="text-xs text-gray-400">1-5 分制</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500">本月回覆</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{monthlyResponses}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">企業</label>
                <select
                  value={companyFilter}
                  onChange={e => setCompanyFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white min-w-[160px]"
                >
                  <option value="">全部企業</option>
                  {companyOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">起始日期</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">結束日期</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs text-gray-500 mb-1">搜尋課程</label>
                <input
                  type="text"
                  placeholder="輸入課程名稱..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Survey table */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">課程</th>
                    <th className="px-4 py-3 text-left">企業</th>
                    <th className="px-4 py-3 text-left">講師</th>
                    <th className="px-4 py-3 text-left">日期</th>
                    <th className="px-4 py-3 text-right">回覆</th>
                    <th className="px-4 py-3 text-right">學習效果</th>
                    <th className="px-4 py-3 text-right">課程評價</th>
                    <th className="px-4 py-3 text-right">講師評價</th>
                    <th className="px-4 py-3 text-right">場地</th>
                    <th className="px-4 py-3 text-right">整體平均</th>
                    <th className="px-4 py-3 text-center">狀態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSurveys.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-gray-400">
                        尚無問卷資料
                      </td>
                    </tr>
                  )}
                  {filteredSurveys.map(s => (
                    <Fragment key={s.id}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setExpandedSurvey(expandedSurvey === s.id ? null : s.id)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{s.courseName}</span>
                          <p className="text-xs text-gray-400">{s.courseType === 'enterprise' ? '企業內訓' : s.courseType === 'public' ? '公開課' : s.courseType}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{s.companyName}</td>
                        <td className="px-4 py-3 text-gray-700">{s.trainer}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(s.courseDate)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{s.responseCount}</td>
                        <td className="px-4 py-3 text-right">
                          {s.responseCount > 0 ? (
                            <span className={`text-xs font-medium ${scoreColor(s.sectionAvgs.learning)}`}>{s.sectionAvgs.learning.toFixed(1)}</span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.responseCount > 0 ? (
                            <span className={`text-xs font-medium ${scoreColor(s.sectionAvgs.course)}`}>{s.sectionAvgs.course.toFixed(1)}</span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.responseCount > 0 ? (
                            <span className={`text-xs font-medium ${scoreColor(s.sectionAvgs.instructor)}`}>{s.sectionAvgs.instructor.toFixed(1)}</span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.responseCount > 0 ? (
                            <span className={`text-xs font-medium ${scoreColor(s.sectionAvgs.venue)}`}>{s.sectionAvgs.venue.toFixed(1)}</span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.responseCount > 0 ? (
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${scoreBgColor(s.overallAvg)}`}>
                              {s.overallAvg.toFixed(2)}
                            </span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {s.isActive ? '開放' : '關閉'}
                          </span>
                        </td>
                      </tr>
                      {expandedSurvey === s.id && (
                        <tr>
                          <td colSpan={11} className="px-4 py-4 bg-gray-50">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <p className="text-xs text-gray-500 mb-1">學習效果</p>
                                <p className={`text-lg font-bold ${scoreColor(s.sectionAvgs.learning)}`}>
                                  {s.responseCount > 0 ? s.sectionAvgs.learning.toFixed(2) : '-'}
                                </p>
                                <p className="text-xs text-gray-400">4 題</p>
                              </div>
                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <p className="text-xs text-gray-500 mb-1">課程評價</p>
                                <p className={`text-lg font-bold ${scoreColor(s.sectionAvgs.course)}`}>
                                  {s.responseCount > 0 ? s.sectionAvgs.course.toFixed(2) : '-'}
                                </p>
                                <p className="text-xs text-gray-400">6 題</p>
                              </div>
                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <p className="text-xs text-gray-500 mb-1">講師評價</p>
                                <p className={`text-lg font-bold ${scoreColor(s.sectionAvgs.instructor)}`}>
                                  {s.responseCount > 0 ? s.sectionAvgs.instructor.toFixed(2) : '-'}
                                </p>
                                <p className="text-xs text-gray-400">10 題</p>
                              </div>
                              <div className="bg-white rounded-lg border border-gray-200 p-3">
                                <p className="text-xs text-gray-500 mb-1">場地</p>
                                <p className={`text-lg font-bold ${scoreColor(s.sectionAvgs.venue)}`}>
                                  {s.responseCount > 0 ? s.sectionAvgs.venue.toFixed(2) : '-'}
                                </p>
                                <p className="text-xs text-gray-400">2 題</p>
                              </div>
                            </div>
                            {s.companyId && (
                              <Link
                                href={`/companies/${s.companyId}/courses/${s.courseId}/survey-results`}
                                className="inline-block text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                查看完整問卷統計 &rarr;
                              </Link>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'students' && (
        <>
          {/* Student search */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <label className="block text-xs text-gray-500 mb-1">搜尋學員</label>
            <input
              type="text"
              placeholder="輸入學員姓名..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white max-w-md"
            />
          </div>

          {/* Student list */}
          <div className="space-y-3">
            {filteredStudents.length === 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                {studentSearch ? '找不到符合的學員' : '尚無學員問卷資料'}
              </div>
            )}
            {filteredStudents.map(student => (
              <div key={student.id} className="bg-white rounded-xl border border-gray-200">
                <div
                  className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-medium">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-400">已填寫 {student.surveyCount} 份問卷</p>
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedStudent === student.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {expandedStudent === student.id && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                    {student.responses.map((r, idx) => {
                      const respKey = `${student.id}-${idx}`
                      const isExpanded = expandedResponse === respKey
                      return (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* 摘要列 */}
                          <div
                            className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                            onClick={() => setExpandedResponse(isExpanded ? null : respKey)}
                          >
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{r.courseName}</p>
                                <p className="text-xs text-gray-400">{r.companyName} · {formatDate(r.courseDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex gap-2 text-xs">
                                <span className={scoreColor(r.sectionAvgs.learning)}>學習 {r.sectionAvgs.learning.toFixed(1)}</span>
                                <span className={scoreColor(r.sectionAvgs.course)}>課程 {r.sectionAvgs.course.toFixed(1)}</span>
                                <span className={scoreColor(r.sectionAvgs.instructor)}>講師 {r.sectionAvgs.instructor.toFixed(1)}</span>
                                <span className={scoreColor(r.sectionAvgs.venue)}>場地 {r.sectionAvgs.venue.toFixed(1)}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${scoreBgColor(r.overallAvg)}`}>
                                {r.overallAvg.toFixed(2)}
                              </span>
                              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>

                          {/* 完整問卷內容 */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">
                              {/* 各面向逐題分數 */}
                              <ScoreDetail title="學習效果" questions={LEARNING_EFFECT} scores={r.scores.le} />
                              <ScoreDetail title="課程評價" questions={COURSE_EVAL} scores={r.scores.ce} />
                              <ScoreDetail title="講師評價" questions={INSTRUCTOR_EVAL} scores={r.scores.ie} />
                              <ScoreDetail title="訓練場地" questions={VENUE_EVAL} scores={r.scores.ve} />

                              {/* 開放式問題 */}
                              {Object.keys(r.openAnswers).length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-2">開放式問題</p>
                                  <div className="space-y-2">
                                    {OPEN_QUESTIONS.map(q => {
                                      const answer = r.openAnswers[q.key]
                                      if (!answer) return null
                                      return (
                                        <div key={q.key} className="bg-white rounded-lg border border-gray-200 p-3">
                                          <p className="text-xs text-gray-500 mb-1">{q.label}</p>
                                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{answer}</p>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* 未來期待課程 */}
                              {r.futureCourses.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 mb-2">未來期待課程</p>
                                  <div className="flex flex-wrap gap-2">
                                    {r.futureCourses.map((fc, i) => (
                                      <span key={fc} className="text-xs bg-indigo-50 text-indigo-700 rounded-lg px-2.5 py-1">
                                        {i + 1}. {fc}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <p className="text-xs text-gray-400">填寫時間：{r.submittedAt ? formatDate(r.submittedAt) : '-'}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ScoreDetail({ title, questions, scores }: { title: string; questions: string[]; scores: number[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 mb-1.5">{title}</p>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {questions.map((q, i) => {
          const score = scores[i] ?? 0
          return (
            <div key={i} className="flex items-center justify-between px-3 py-2">
              <span className="text-xs text-gray-700 flex-1">{i + 1}. {q}</span>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <div className="w-20 h-1.5 bg-gray-100 rounded-full">
                  <div className={`h-1.5 rounded-full ${score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-blue-500' : score >= 2 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${(score / 5) * 100}%` }} />
                </div>
                <span className={`text-xs font-medium w-8 text-right ${scoreColor(score)}`}>
                  {score > 0 ? SCORE_LABELS[score - 1] ?? score : '-'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
