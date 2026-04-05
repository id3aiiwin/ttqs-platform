import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sc = createServiceClient()
  const url = new URL(request.url)
  const quizId = url.searchParams.get('quiz_id')
  const userId = url.searchParams.get('user_id')
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50))
  const offset = (page - 1) * limit

  let query = sc
    .from('quiz_attempts')
    .select('*, profiles!quiz_attempts_user_id_fkey(full_name, email), quizzes!quiz_attempts_quiz_id_fkey(title, pass_score)', { count: 'exact' })
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (quizId) query = query.eq('quiz_id', quizId)
  if (userId) query = query.eq('user_id', userId)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, total: count, page, limit })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sc = createServiceClient()
  const body = await request.json()

  if (body.action === 'manual') {
    const { quiz_id, user_id, score, total, passed, completed_at } = body
    if (!quiz_id || !user_id || score == null || total == null)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0

    const { error } = await sc.from('quiz_attempts').insert({
      quiz_id,
      user_id,
      score,
      total,
      percentage,
      passed: passed ?? false,
      answers: [],
      completed_at: completed_at || new Date().toISOString(),
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'bulk_import') {
    const rows: { name: string; email: string; quiz_title: string; score: number; total: number; date: string }[] = body.rows
    if (!rows?.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 })

    // Pre-fetch profiles and quizzes for matching
    const { data: profiles } = await sc.from('profiles').select('id, full_name, email')
    const { data: quizzes } = await sc.from('quizzes').select('id, title, pass_score')

    const profileMap = new Map<string, { id: string }>()
    for (const p of profiles ?? []) {
      if (p.email) profileMap.set(p.email.toLowerCase(), { id: p.id })
      if (p.full_name) profileMap.set(p.full_name.trim().toLowerCase(), { id: p.id })
      // Also key by name+email combo
      if (p.full_name && p.email) {
        profileMap.set(`${p.full_name.trim().toLowerCase()}|${p.email.toLowerCase()}`, { id: p.id })
      }
    }

    const quizMap = new Map<string, { id: string; pass_score: number }>()
    for (const q of quizzes ?? []) {
      quizMap.set(q.title.trim().toLowerCase(), { id: q.id, pass_score: Number(q.pass_score) || 60 })
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Match user: try name+email combo first, then email, then name
      const combo = `${(row.name || '').trim().toLowerCase()}|${(row.email || '').trim().toLowerCase()}`
      const matched = profileMap.get(combo)
        ?? profileMap.get((row.email || '').trim().toLowerCase())
        ?? profileMap.get((row.name || '').trim().toLowerCase())

      if (!matched) {
        errors.push(`Row ${i + 1}: User not found - ${row.name} (${row.email})`)
        failed++
        continue
      }

      // Match quiz by title
      const quiz = quizMap.get((row.quiz_title || '').trim().toLowerCase())
      if (!quiz) {
        errors.push(`Row ${i + 1}: Quiz not found - ${row.quiz_title}`)
        failed++
        continue
      }

      const score = Number(row.score) || 0
      const total = Number(row.total) || 100
      const percentage = total > 0 ? Math.round((score / total) * 100) : 0
      const passed = percentage >= quiz.pass_score

      const { error } = await sc.from('quiz_attempts').insert({
        quiz_id: quiz.id,
        user_id: matched.id,
        score,
        total,
        percentage,
        passed,
        answers: [],
        completed_at: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
      })

      if (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
        failed++
      } else {
        success++
      }
    }

    return NextResponse.json({ ok: true, success, failed, errors: errors.slice(0, 20) })
  }

  if (body.action === 'line_chat_import') {
    const { sessions } = body as {
      sessions: {
        quizName: string
        studentName: string
        companyName: string | null
        personName: string
        answers: { questionNumber: number; answer: string; questionPreview: string }[]
        result: string | null
        totalQuestions: number
        startDate: string
        endDate: string
        startTime: string
        endTime: string
      }[]
    }

    if (!sessions?.length) return NextResponse.json({ error: 'No sessions provided' }, { status: 400 })

    // Pre-fetch profiles and quizzes for matching
    const { data: profiles } = await sc.from('profiles').select('id, full_name, email')
    const { data: quizzes } = await sc.from('quizzes').select('id, title, pass_score')

    // Build profile lookup map (full_name and partial name after dash)
    const profileByName = new Map<string, string>()
    for (const p of profiles ?? []) {
      if (p.full_name) {
        const name = p.full_name.trim().toLowerCase()
        profileByName.set(name, p.id)
        // Also index by name after last dash (e.g., "泰瑋-謝杏鈺" → "謝杏鈺")
        const dashIdx = name.lastIndexOf('-')
        const altDash = name.lastIndexOf('－') // fullwidth dash
        const idx = Math.max(dashIdx, altDash)
        if (idx >= 0 && idx < name.length - 1) {
          profileByName.set(name.substring(idx + 1).trim(), p.id)
        }
      }
      if (p.email) {
        profileByName.set(p.email.toLowerCase(), p.id)
      }
    }

    // Build quiz lookup map
    const quizByTitle = new Map<string, string>()
    for (const q of quizzes ?? []) {
      quizByTitle.set(q.title.trim().toLowerCase(), q.id)
    }

    let success = 0
    let failed = 0
    const errors: string[] = []

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i]

      // Find or create quiz
      let quizId = quizByTitle.get(session.quizName.trim().toLowerCase())
      if (!quizId) {
        // Create a new quiz record for this LINE quiz
        const { data: newQuiz, error: createErr } = await sc.from('quizzes').insert({
          title: session.quizName,
          description: `LINE Bot 測驗 - ${session.quizName}`,
          is_published: true,
          questions: [],
          pass_score: 0,
          total_points: session.totalQuestions,
        }).select('id').single()

        if (createErr || !newQuiz) {
          errors.push(`Session ${i + 1}: Failed to create quiz "${session.quizName}" - ${createErr?.message}`)
          failed++
          continue
        }
        quizId = newQuiz.id
        quizByTitle.set(session.quizName.trim().toLowerCase(), quizId)
      }

      // Find user by personName (企業名-人名 format, personName = 人名)
      const personNameLower = session.personName.trim().toLowerCase()
      let userId = profileByName.get(personNameLower)

      // Also try full studentName
      if (!userId) {
        userId = profileByName.get(session.studentName.trim().toLowerCase())
      }

      if (!userId) {
        const displayName = session.companyName ? `${session.companyName} - ${session.personName}` : session.personName
        errors.push(`找不到學員「${displayName}」`)
        failed++
        continue
      }

      // Build answers array with result appended
      const answersPayload: unknown[] = session.answers.map(a => ({
        questionNumber: a.questionNumber,
        answer: a.answer,
        questionPreview: a.questionPreview,
      }))

      if (session.result) {
        answersPayload.push({ type: 'result', value: session.result })
      }

      // Build completed_at from endDate + endTime
      let completedAt: string
      try {
        // endDate format could be "2025/03/15" or "2025-03-15"
        const dateStr = session.endDate.replace(/\//g, '-')
        const timeStr = session.endTime || '00:00'
        completedAt = new Date(`${dateStr}T${timeStr}`).toISOString()
      } catch {
        completedAt = new Date().toISOString()
      }

      const { error: insertErr } = await sc.from('quiz_attempts').insert({
        quiz_id: quizId,
        user_id: userId,
        score: 0,
        total: session.totalQuestions,
        percentage: 0,
        passed: true, // personality tests always "pass"
        answers: answersPayload,
        completed_at: completedAt,
      })

      if (insertErr) {
        errors.push(`Session ${i + 1}: ${insertErr.message}`)
        failed++
      } else {
        success++
      }
    }

    return NextResponse.json({ ok: true, success, failed, errors: errors.slice(0, 20) })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
