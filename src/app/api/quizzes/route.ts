import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action } = body
  const sc = createServiceClient()

  if (action === 'create') {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    const { error } = await sc.from('quizzes').insert({
      title: body.title, description: body.description,
      questions: body.questions ?? [], time_limit: body.time_limit ?? null,
      pass_score: body.pass_score ?? 60, is_published: false, created_by: user?.id ?? null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update') {
    const { id, ...updates } = body; delete updates.action
    const { error } = await sc.from('quizzes').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete') {
    const { error } = await sc.from('quizzes').delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'submit_attempt') {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

    // 取得測驗題目
    const { data: quiz } = await sc.from('quizzes').select('questions, pass_score').eq('id', body.quiz_id).single()
    if (!quiz) return NextResponse.json({ error: '找不到測驗' }, { status: 404 })

    const questions = quiz.questions as { id: string; correct_answer: string | string[]; points: number }[]
    const answers = body.answers as { question_id: string; answer: string | string[] }[]

    // 計分
    let score = 0
    let total = 0
    for (const q of questions) {
      total += q.points
      const userAnswer = answers.find(a => a.question_id === q.id)
      if (!userAnswer) continue
      if (Array.isArray(q.correct_answer)) {
        if (Array.isArray(userAnswer.answer) && JSON.stringify([...q.correct_answer].sort()) === JSON.stringify([...userAnswer.answer].sort())) {
          score += q.points
        }
      } else if (userAnswer.answer === q.correct_answer) {
        score += q.points
      }
    }

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0
    const passed = percentage >= (quiz.pass_score ?? 60)

    const { error } = await sc.from('quiz_attempts').insert({
      quiz_id: body.quiz_id, user_id: user.id, answers: body.answers,
      score, total, percentage, passed,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, score, total, percentage, passed })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
