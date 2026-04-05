'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Question { id: string; type: string; question: string; options?: string[]; correct_answer: string | string[]; points: number }
interface Quiz { id: string; title: string; description: string | null; questions: Question[]; pass_score: number; is_published: boolean; created_at: string }

export function QuizManagementClient({ quizzes }: { quizzes: Quiz[] }) {
  const [adding, setAdding] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)
  const [form, setForm] = useState({ title: '', description: '', pass_score: '60' })
  const [questions, setQuestions] = useState<Question[]>([])
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function addQuestion() {
    setQuestions([...questions, {
      id: `q_${Date.now()}`, type: 'single', question: '',
      options: ['', '', '', ''], correct_answer: '', points: 10,
    }])
  }

  function updateQuestion(idx: number, q: Question) {
    const updated = [...questions]; updated[idx] = q; setQuestions(updated)
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  function handleSave() {
    if (!form.title.trim()) return
    startTransition(async () => {
      await fetch('/api/quizzes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: editingQuiz ? 'update' : 'create',
          id: editingQuiz?.id,
          title: form.title.trim(), description: form.description || null,
          questions, pass_score: Number(form.pass_score) || 60,
        }),
      })
      setForm({ title: '', description: '', pass_score: '60' })
      setQuestions([]); setAdding(false); setEditingQuiz(null)
      router.refresh()
    })
  }

  function handleTogglePublish(quizId: string, currentState: boolean) {
    startTransition(async () => {
      await fetch('/api/quizzes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id: quizId, is_published: !currentState }),
      })
      router.refresh()
    })
  }

  function handleDelete(quizId: string) {
    if (!confirm('確定刪除此測驗？')) return
    startTransition(async () => {
      await fetch('/api/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id: quizId }) })
      router.refresh()
    })
  }

  function openEdit(quiz: Quiz) {
    setEditingQuiz(quiz)
    setForm({ title: quiz.title, description: quiz.description ?? '', pass_score: String(quiz.pass_score) })
    setQuestions(quiz.questions ?? [])
    setAdding(true)
  }

  if (adding) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{editingQuiz ? '編輯測驗' : '建立測驗'}</h3>
        <div className="space-y-4">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="測驗名稱 *"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" autoFocus />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="說明（選填）" rows={2}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2" />
          <input type="number" value={form.pass_score} onChange={e => setForm({ ...form, pass_score: e.target.value })} placeholder="及格分數"
            className="w-32 text-sm border border-gray-300 rounded-lg px-3 py-2" />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">題目（{questions.length} 題）</p>
              <button onClick={addQuestion} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">+ 新增題目</button>
            </div>

            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xs text-gray-400 mt-1">Q{i + 1}</span>
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <select value={q.type} onChange={e => updateQuestion(i, { ...q, type: e.target.value })}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white w-24">
                          <option value="single">單選</option>
                          <option value="multiple">多選</option>
                          <option value="truefalse">是非</option>
                          <option value="short">簡答</option>
                        </select>
                        <input type="number" value={q.points} onChange={e => updateQuestion(i, { ...q, points: Number(e.target.value) })}
                          className="text-xs border border-gray-300 rounded px-2 py-1 w-16" placeholder="分數" />
                      </div>
                      <input value={q.question} onChange={e => updateQuestion(i, { ...q, question: e.target.value })}
                        placeholder="題目內容" className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />

                      {(q.type === 'single' || q.type === 'multiple') && (
                        <div className="space-y-1">
                          {(q.options ?? []).map((opt, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <input type={q.type === 'single' ? 'radio' : 'checkbox'}
                                checked={Array.isArray(q.correct_answer) ? q.correct_answer.includes(opt) : q.correct_answer === opt}
                                onChange={() => {
                                  if (q.type === 'single') updateQuestion(i, { ...q, correct_answer: opt })
                                  else {
                                    const arr = Array.isArray(q.correct_answer) ? [...q.correct_answer] : []
                                    if (arr.includes(opt)) updateQuestion(i, { ...q, correct_answer: arr.filter(a => a !== opt) })
                                    else updateQuestion(i, { ...q, correct_answer: [...arr, opt] })
                                  }
                                }}
                                className="text-indigo-600" />
                              <input value={opt} onChange={e => {
                                const opts = [...(q.options ?? [])]; opts[j] = e.target.value; updateQuestion(i, { ...q, options: opts })
                              }} placeholder={`選項 ${j + 1}`} className="flex-1 text-xs border border-gray-300 rounded px-2 py-1" />
                            </div>
                          ))}
                          <button onClick={() => updateQuestion(i, { ...q, options: [...(q.options ?? []), ''] })}
                            className="text-[10px] text-indigo-500">+ 新增選項</button>
                        </div>
                      )}

                      {q.type === 'truefalse' && (
                        <div className="flex gap-3">
                          {['是', '否'].map(v => (
                            <label key={v} className="flex items-center gap-1 text-sm">
                              <input type="radio" checked={q.correct_answer === v}
                                onChange={() => updateQuestion(i, { ...q, correct_answer: v })} className="text-indigo-600" />
                              {v}
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'short' && (
                        <input value={q.correct_answer as string} onChange={e => updateQuestion(i, { ...q, correct_answer: e.target.value })}
                          placeholder="正確答案" className="text-xs border border-gray-300 rounded px-2 py-1 w-full" />
                      )}
                    </div>
                    <button onClick={() => removeQuestion(i)} className="text-xs text-red-400 hover:text-red-600 mt-1">刪除</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-gray-200">
            <button onClick={handleSave} disabled={pending || !form.title.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {pending ? '儲存中...' : '儲存'}
            </button>
            <button onClick={() => { setAdding(false); setEditingQuiz(null); setQuestions([]) }}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">取消</button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <button onClick={() => setAdding(true)} className="mb-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">+ 建立測驗</button>
      <Card>
        <div className="divide-y divide-gray-100">
          {quizzes.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">尚無測驗</p>
          ) : quizzes.map(q => (
            <div key={q.id} className="px-6 py-3 flex items-center justify-between group">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{q.title}</p>
                  <Badge variant={q.is_published ? 'success' : 'default'}>{q.is_published ? '已發佈' : '草稿'}</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{q.questions.length} 題 · 及格 {q.pass_score} 分</p>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(q)} className="text-xs text-indigo-600 hover:text-indigo-700">編輯</button>
                <button onClick={() => handleTogglePublish(q.id, q.is_published)} className="text-xs text-amber-600">{q.is_published ? '下架' : '發佈'}</button>
                <button onClick={() => handleDelete(q.id)} className="text-xs text-red-400 hover:text-red-600">刪除</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
