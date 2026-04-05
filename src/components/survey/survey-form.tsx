'use client'

import { useState, useRef } from 'react'
import {
  LEARNING_EFFECT, COURSE_EVAL, INSTRUCTOR_EVAL, VENUE_EVAL,
  OPEN_QUESTIONS, FUTURE_COURSES, SCORE_LABELS,
} from '@/lib/survey-questions'

const REQUIRED_OPEN_KEYS = ['q1', 'q2', 'q3']

interface SurveyFormProps {
  surveyId: string; courseName: string; courseDate: string; instructor: string
}

export function SurveyForm({ surveyId, courseName, courseDate, instructor }: SurveyFormProps) {
  const [name, setName] = useState('')
  const [birthday, setBirthday] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [lineId, setLineId] = useState('')
  const [autoFilled, setAutoFilled] = useState(false)

  const [leScores, setLeScores] = useState<number[]>(Array(4).fill(0))
  const [courseScores, setCourseScores] = useState<number[]>(Array(6).fill(0))
  const [instrScores, setInstrScores] = useState<number[]>(Array(10).fill(0))
  const [venueScores, setVenueScores] = useState<number[]>(Array(2).fill(0))
  const [openAnswers, setOpenAnswers] = useState<Record<string, string>>({})
  const [futurePicks, setFuturePicks] = useState<string[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const formRef = useRef<HTMLDivElement>(null)

  async function handleLookup() {
    if (!name || !birthday) return
    try {
      const res = await fetch(`/api/survey?name=${encodeURIComponent(name)}&birthday=${birthday}`)
      const data = await res.json()
      if (data?.email) { setEmail(data.email); setPhone(data.phone ?? ''); setLineId(data.line_id ?? ''); setAutoFilled(true) }
    } catch {}
  }

  function toggleFuture(item: string) {
    setFuturePicks((prev) => {
      if (prev.includes(item)) return prev.filter((p) => p !== item)
      if (prev.length >= 3) return prev
      return [...prev, item]
    })
  }

  function setScore(setter: typeof setLeScores, idx: number, val: number) {
    setter((prev) => { const n = [...prev]; n[idx] = val; return n })
  }

  function validate(): string[] {
    const errs: string[] = []
    if (!name.trim()) errs.push('name')
    if (!birthday) errs.push('birthday')
    leScores.forEach((s, i) => { if (s === 0) errs.push(`le_${i}`) })
    courseScores.forEach((s, i) => { if (s === 0) errs.push(`ce_${i}`) })
    instrScores.forEach((s, i) => { if (s === 0) errs.push(`ie_${i}`) })
    venueScores.forEach((s, i) => { if (s === 0) errs.push(`ve_${i}`) })
    REQUIRED_OPEN_KEYS.forEach((k) => { if (!openAnswers[k]?.trim()) errs.push(`open_${k}`) })
    if (futurePicks.length === 0) errs.push('future')
    return errs
  }

  async function handleSubmit() {
    const errs = validate()
    setErrors(errs)
    if (errs.length > 0) {
      // 捲動到第一個錯誤
      const firstId = errs[0]
      const el = document.getElementById(`field-${firstId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId, respondent: { name, birthday, email, phone, line_id: lineId },
          scores: { learning_effect: leScores, course: courseScores, instructor: instrScores, venue: venueScores },
          openAnswers, futureCourses: futurePicks,
        }),
      })
      const data = await res.json()
      if (data.ok) setSubmitted(true)
      else alert(data.error || '送出失敗')
    } catch { alert('送出失敗') }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">感謝您的填寫！</h1>
        <p className="text-gray-500">問卷已成功送出</p>
      </div>
    )
  }

  const hasErrors = errors.length > 0

  return (
    <div className="max-w-2xl mx-auto p-6" ref={formRef}>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">課後問卷調查</h1>
        <p className="text-gray-500 mt-1">{courseName}</p>
      </div>

      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-700">
          有 {errors.length} 個必填項目尚未完成，請檢查後重新送出。
        </div>
      )}

      {/* 課程資訊 */}
      <div className="bg-indigo-50 rounded-xl p-4 mb-6 grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-gray-500">課程名稱：</span><span className="text-gray-900">{courseName}</span></div>
        <div><span className="text-gray-500">課程日期：</span><span className="text-gray-900">{courseDate || '—'}</span></div>
        <div><span className="text-gray-500">授課導師：</span><span className="text-gray-900">{instructor || '—'}</span></div>
      </div>

      {/* 個人資料 */}
      <Section title="學員資料">
        <div className="grid grid-cols-2 gap-3">
          <div id="field-name">
            <Field label="姓名" required value={name} onChange={setName} onBlur={handleLookup} error={errors.includes('name')} />
          </div>
          <div id="field-birthday">
            <Field label="生日" required value={birthday} onChange={setBirthday} type="date" onBlur={handleLookup} error={errors.includes('birthday')} />
          </div>
          <Field label="電郵" value={email} onChange={setEmail} optional />
          <Field label="電話" value={phone} onChange={setPhone} optional />
          <Field label="LINE ID" value={lineId} onChange={setLineId} optional />
        </div>
        {autoFilled && <p className="text-xs text-green-600 mt-2">已自動帶入上次填寫的聯絡資料</p>}
      </Section>

      {/* 評分 */}
      <RatingSection title="學習效果" questions={LEARNING_EFFECT} scores={leScores}
        setScore={(i, v) => setScore(setLeScores, i, v)} errors={errors} prefix="le" required />
      <RatingSection title="課程評價" questions={COURSE_EVAL} scores={courseScores}
        setScore={(i, v) => setScore(setCourseScores, i, v)} errors={errors} prefix="ce" required />
      <RatingSection title="講師評價" questions={INSTRUCTOR_EVAL} scores={instrScores}
        setScore={(i, v) => setScore(setInstrScores, i, v)} errors={errors} prefix="ie" required />
      <RatingSection title="訓練場地" questions={VENUE_EVAL} scores={venueScores}
        setScore={(i, v) => setScore(setVenueScores, i, v)} errors={errors} prefix="ve" required />

      {/* 簡答 */}
      <Section title="開放式問題">
        {OPEN_QUESTIONS.map((q) => {
          const isReq = REQUIRED_OPEN_KEYS.includes(q.key)
          const hasErr = errors.includes(`open_${q.key}`)
          return (
            <div key={q.key} className="mb-4" id={`field-open_${q.key}`}>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                {q.label}
                {isReq ? <span className="text-red-500 ml-0.5">*</span> : <span className="text-gray-400 text-xs ml-1">選填</span>}
              </label>
              <textarea rows={3} value={openAnswers[q.key] ?? ''}
                onChange={(e) => setOpenAnswers((p) => ({ ...p, [q.key]: e.target.value }))}
                className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none resize-y ${
                  hasErr ? 'border-red-400 focus:border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-indigo-500'
                }`} />
              {hasErr && <p className="text-xs text-red-500 mt-0.5">此題為必填</p>}
            </div>
          )
        })}
      </Section>

      {/* 未來期待課程 */}
      <div id="field-future">
        <Section title={<>未來期待課程<span className="text-red-500 ml-0.5 text-sm">*</span><span className="text-gray-400 text-xs ml-1">（請選 1~3 個並排序）</span></>}>
          <div className="grid grid-cols-2 gap-2">
            {FUTURE_COURSES.map((fc) => {
              const idx = futurePicks.indexOf(fc)
              const selected = idx >= 0
              return (
                <button key={fc} type="button" onClick={() => toggleFuture(fc)}
                  className={`text-left text-sm rounded-lg border px-3 py-2 transition-colors ${
                    selected ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  } ${!selected && futurePicks.length >= 3 ? 'opacity-40' : ''}`}>
                  {selected && <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full text-xs mr-2">{idx + 1}</span>}
                  {fc}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">已選 {futurePicks.length}/3</p>
          {errors.includes('future') && <p className="text-xs text-red-500 mt-1">請至少選擇一個</p>}
        </Section>
      </div>

      <button onClick={handleSubmit} disabled={submitting}
        className="w-full bg-indigo-600 text-white rounded-xl py-3 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
        {submitting ? '送出中...' : '送出問卷'}
      </button>
    </div>
  )
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
      <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value, onChange, type, onBlur, required, optional, error }: {
  label: string; value: string; onChange: (v: string) => void; type?: string
  onBlur?: () => void; required?: boolean; optional?: boolean; error?: boolean
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {optional && <span className="text-gray-400 text-xs ml-1">選填</span>}
      </label>
      <input type={type ?? 'text'} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none ${
          error ? 'border-red-400 focus:border-red-500 bg-red-50/30' : 'border-gray-300 focus:border-indigo-500'
        }`} />
      {error && <p className="text-xs text-red-500 mt-0.5">此欄位為必填</p>}
    </div>
  )
}

function RatingSection({ title, questions, scores, setScore, errors, prefix, required }: {
  title: string; questions: string[]; scores: number[]; setScore: (i: number, v: number) => void
  errors: string[]; prefix: string; required?: boolean
}) {
  return (
    <Section title={<>{title}{required && <span className="text-red-500 ml-0.5 text-sm">*</span>}</>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left pb-2 text-gray-500 font-normal">題目</th>
              {SCORE_LABELS.map((l, i) => (
                <th key={i} className="text-center pb-2 text-xs text-gray-400 font-normal w-16">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((q, qi) => {
              const hasErr = errors.includes(`${prefix}_${qi}`)
              return (
                <tr key={qi} className={`border-t border-gray-100 ${hasErr ? 'bg-red-50/30' : ''}`}
                  id={`field-${prefix}_${qi}`}>
                  <td className="py-2.5 pr-4 text-gray-700">
                    {qi + 1}. {q}
                    {hasErr && <span className="text-red-500 text-xs ml-1">未填</span>}
                  </td>
                  {[1, 2, 3, 4, 5].map((v) => (
                    <td key={v} className="text-center py-2.5">
                      <button type="button" onClick={() => setScore(qi, v)}
                        className={`w-8 h-8 rounded-full border-2 transition-colors ${
                          scores[qi] === v ? 'border-indigo-500 bg-indigo-500 text-white' : hasErr ? 'border-red-300 hover:border-red-400' : 'border-gray-300 hover:border-indigo-300'
                        }`}>
                        <span className="text-xs">{v}</span>
                      </button>
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
