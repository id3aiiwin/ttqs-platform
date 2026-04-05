'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Question { id: string; type: string; question: string; options?: string[]; correct_answer: string | string[]; points: number }
interface Quiz { id: string; title: string; description: string | null; questions: Question[]; pass_score: number }
interface Attempt { id: string; score: number | null; total: number | null; percentage: number | null; passed: boolean; completed_at: string }

export function QuizTakeClient({ quiz, userId, attempts }: { quiz: Quiz; userId: string; attempts: Attempt[] }) {
  const [taking, setTaking] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; passed: boolean } | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    const answerArray = Object.entries(answers).map(([qid, ans]) => ({ question_id: qid, answer: ans }))
    startTransition(async () => {
      const res = await fetch('/api/quizzes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit_attempt', quiz_id: quiz.id, answers: answerArray }),
      })
      const data = await res.json()
      if (data.ok) setResult(data)
      else alert(data.error)
    })
  }

  if (result) {
    return (
      <Card>
        <CardBody>
          <div className="text-center py-8">
            <div className="text-5xl mb-4">{result.passed ? '🎉' : '📝'}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{result.passed ? '恭喜通過！' : '繼續加油！'}</h2>
            <p className="text-4xl font-bold mb-2">
              <span className={result.passed ? 'text-green-600' : 'text-amber-600'}>{result.percentage}%</span>
            </p>
            <p className="text-gray-500">得分 {result.score} / {result.total}（及格 {quiz.pass_score} 分）</p>
            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => { setResult(null); setTaking(false); setAnswers({}); router.refresh() }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600">返回</button>
              <button onClick={() => { setResult(null); setAnswers({}) }}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">重新作答</button>
            </div>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (taking) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{quiz.title}</h2>
          <button onClick={() => setTaking(false)} className="text-xs text-gray-400">放棄</button>
        </div>
        <div className="space-y-4">
          {quiz.questions.map((q, i) => (
            <Card key={q.id} className="p-4">
              <p className="text-sm font-medium text-gray-900 mb-3">
                <span className="text-indigo-500 mr-1">Q{i + 1}.</span> {q.question}
                <span className="text-xs text-gray-400 ml-2">({q.points} 分)</span>
              </p>

              {(q.type === 'single' || q.type === 'truefalse') && (
                <div className="space-y-2">
                  {(q.type === 'truefalse' ? ['是', '否'] : q.options ?? []).map(opt => (
                    <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${answers[q.id] === opt ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name={q.id} checked={answers[q.id] === opt}
                        onChange={() => setAnswers({ ...answers, [q.id]: opt })} className="text-indigo-600" />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'multiple' && (
                <div className="space-y-2">
                  {(q.options ?? []).map(opt => {
                    const selected = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).includes(opt) : false
                    return (
                      <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${selected ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200'}`}>
                        <input type="checkbox" checked={selected}
                          onChange={() => {
                            const arr = Array.isArray(answers[q.id]) ? [...(answers[q.id] as string[])] : []
                            if (selected) setAnswers({ ...answers, [q.id]: arr.filter(a => a !== opt) })
                            else setAnswers({ ...answers, [q.id]: [...arr, opt] })
                          }} className="rounded text-indigo-600" />
                        <span className="text-sm">{opt}</span>
                      </label>
                    )
                  })}
                </div>
              )}

              {q.type === 'short' && (
                <input value={(answers[q.id] as string) ?? ''} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="請輸入答案" className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
              )}
            </Card>
          ))}
        </div>

        <button onClick={handleSubmit} disabled={pending}
          className="w-full mt-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50">
          {pending ? '提交中...' : '提交答案'}
        </button>
      </div>
    )
  }

  // 測驗首頁
  return (
    <Card>
      <CardBody>
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{quiz.title}</h2>
          {quiz.description && <p className="text-gray-500 mb-4">{quiz.description}</p>}
          <div className="flex justify-center gap-4 text-sm text-gray-500 mb-6">
            <span>{quiz.questions.length} 題</span>
            <span>及格 {quiz.pass_score} 分</span>
          </div>
          <button onClick={() => setTaking(true)}
            className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">
            {attempts.length > 0 ? '再次作答' : '開始作答'}
          </button>

          {attempts.length > 0 && (
            <div className="mt-8 text-left max-w-md mx-auto">
              <p className="text-sm font-medium text-gray-700 mb-2">作答紀錄（{attempts.length} 次）</p>
              <div className="space-y-2">
                {attempts.map((a, i) => (
                  <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-xs text-gray-500">第 {attempts.length - i} 次</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.passed ? 'success' : 'warning'}>{a.passed ? '通過' : '未通過'}</Badge>
                      <span className="text-sm font-bold">{a.percentage}%</span>
                      <span className="text-xs text-gray-400">{new Date(a.completed_at).toLocaleDateString('zh-TW')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
