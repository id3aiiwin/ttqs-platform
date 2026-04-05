'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface QuizAttempt {
  id: string
  quiz_id: string
  quiz_title: string
  answers: unknown[] | null
  score: number
  total: number
  percentage: number
  passed: boolean
  completed_at: string
}

interface Props {
  attempts: QuizAttempt[]
}

function scoreColor(pct: number) {
  if (pct >= 80) return 'text-green-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function MyQuizzesClient({ attempts }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalAttempts = attempts.length
  const passedCount = attempts.filter(a => a.passed).length
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0
  const avgScore = totalAttempts > 0 ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / totalAttempts) : 0

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '總測驗數', value: `${totalAttempts}`, unit: '次' },
          { label: '通過率', value: `${passRate}`, unit: '%' },
          { label: '平均分數', value: `${avgScore}`, unit: '%' },
        ].map(s => (
          <Card key={s.label} className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}<span className="text-sm font-normal text-gray-400 ml-1">{s.unit}</span></p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Attempt list */}
      {attempts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-400 text-sm">尚無測驗紀錄</p>
          <a href="/my-learning" className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 inline-block">前往我的學習 &rarr;</a>
        </Card>
      ) : (
        <div className="space-y-3">
          {attempts.map(a => {
            const expanded = expandedId === a.id
            const hasAnswers = Array.isArray(a.answers) && a.answers.length > 0

            return (
              <Card key={a.id} className="overflow-hidden">
                <button
                  type="button"
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  onClick={() => hasAnswers && setExpandedId(expanded ? null : a.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.quiz_title}</p>
                      <Badge variant={a.passed ? 'success' : 'danger'}>
                        {a.passed ? '通過' : '未通過'}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(a.completed_at)}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <p className={`text-lg font-bold ${scoreColor(a.percentage)}`}>{a.percentage}%</p>
                      <p className="text-xs text-gray-400">{a.score}/{a.total}</p>
                    </div>
                    {hasAnswers && (
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </button>

                {expanded && hasAnswers && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <p className="text-xs font-medium text-gray-500 mb-3">作答紀錄</p>
                    <div className="space-y-2">
                      {(a.answers as Record<string, unknown>[]).map((ans, idx) => {
                        const question = (ans.question as string) ?? `第 ${idx + 1} 題`
                        const userAnswer = (ans.user_answer as string) ?? (ans.selected as string) ?? '-'
                        const correct = (ans.correct_answer as string) ?? (ans.answer as string) ?? ''
                        const isCorrect = ans.is_correct as boolean | undefined

                        return (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                              isCorrect === true ? 'bg-green-500' : isCorrect === false ? 'bg-red-500' : 'bg-gray-300'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-gray-700">{question}</p>
                              <p className="text-gray-400 mt-0.5">
                                你的回答：<span className={isCorrect === false ? 'text-red-600' : 'text-green-600'}>{userAnswer}</span>
                                {correct && isCorrect === false && <span className="ml-2">正確答案：<span className="text-green-600">{correct}</span></span>}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
