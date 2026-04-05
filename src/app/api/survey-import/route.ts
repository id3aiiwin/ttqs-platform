import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

function convertScore(val: string): number {
  const v = val.trim()
  // Old 低中高 format
  if (v === '高') return 5
  if (v === '中') return 3
  if (v === '低') return 1
  // Current 5-level agreement format
  if (v === '非常同意') return 5
  if (v === '同意') return 4
  if (v === '普通') return 3
  if (v === '不同意') return 2
  if (v === '非常不同意') return 1
  // 5-level degree format
  if (v === '非常高') return 5
  if (v === '高度') return 4
  if (v === '中度') return 3
  if (v === '低度') return 2
  if (v === '非常低') return 1
  // Numeric
  const n = Number(v)
  if (n >= 1 && n <= 5) return n
  // Percentage format (from old system: 100/80/60/40/20)
  if (n === 100) return 5
  if (n === 80) return 4
  if (n === 60) return 3
  if (n === 40) return 2
  if (n === 20) return 1
  return 0
}

interface ImportRow {
  name?: string
  birthday?: string
  email?: string
  phone?: string
  le1?: string; le2?: string; le3?: string
  ce1?: string; ce2?: string; ce3?: string
  ie1?: string; ie2?: string; ie3?: string
  ve1?: string; ve2?: string
  open_positive?: string
  open_improve?: string
  future_courses?: string
  [key: string]: string | undefined
}

export async function POST(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '僅顧問可使用此功能' }, { status: 403 })
  }

  const sc = createServiceClient()

  const body = await request.json()
  const { course_id, company_id, new_course_title, new_course_date, rows } = body as {
    course_id: string | null
    company_id: string | null
    new_course_title: string | null
    new_course_date: string | null
    rows: ImportRow[]
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: '無資料可匯入' }, { status: 400 })
  }

  // Resolve or create course
  let resolvedCourseId = course_id

  if (!resolvedCourseId && new_course_title) {
    const { data: newCourse, error: courseErr } = await sc.from('courses').insert({
      title: new_course_title,
      start_date: new_course_date || null,
      company_id: company_id || null,
      status: 'completed',
      created_by: user.id,
    }).select('id').single()

    if (courseErr || !newCourse) {
      return NextResponse.json({ error: `建立課程失敗：${courseErr?.message}` }, { status: 500 })
    }
    resolvedCourseId = newCourse.id
  }

  if (!resolvedCourseId) {
    return NextResponse.json({ error: '請選擇或建立課程' }, { status: 400 })
  }

  // Ensure course_surveys exists for this course
  const { data: existingSurvey } = await sc
    .from('course_surveys')
    .select('id')
    .eq('course_id', resolvedCourseId)
    .maybeSingle()

  let surveyId = existingSurvey?.id

  if (!surveyId) {
    const { data: newSurvey } = await sc.from('course_surveys').insert({
      course_id: resolvedCourseId,
      is_active: false,
    }).select('id').single()
    surveyId = newSurvey?.id
  }

  // Load existing company profiles for name matching
  let companyProfiles: { id: string; full_name: string | null }[] = []
  if (company_id) {
    const { data } = await sc.from('profiles').select('id, full_name').eq('company_id', company_id)
    companyProfiles = data ?? []
  }

  let success = 0
  let failed = 0
  let studentsCreated = 0
  let enrollmentsCreated = 0
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1

    try {
      const name = row.name?.trim()
      if (!name) {
        errors.push(`第 ${rowNum} 筆：缺少姓名`)
        failed++
        continue
      }

      const birthday = row.birthday?.trim() || null
      const email = row.email?.trim() || null
      const phone = row.phone?.trim() || null

      // Upsert survey_respondents (by name + birthday)
      let respondentId: string | null = null
      if (birthday) {
        const { data: existing } = await sc
          .from('survey_respondents')
          .select('id')
          .eq('name', name)
          .eq('birthday', birthday)
          .maybeSingle()

        if (existing) {
          respondentId = existing.id
        }
      }

      if (!respondentId) {
        const { data: newResp, error: respErr } = await sc.from('survey_respondents').insert({
          name,
          birthday: birthday || '1900-01-01',
          email,
          phone,
        }).select('id').single()

        if (respErr) {
          // Try without unique constraint error - maybe respondent exists by name only
          const { data: byName } = await sc
            .from('survey_respondents')
            .select('id')
            .eq('name', name)
            .maybeSingle()
          respondentId = byName?.id ?? null

          if (!respondentId) {
            errors.push(`第 ${rowNum} 筆 (${name})：建立回應者失敗 - ${respErr.message}`)
            failed++
            continue
          }
        } else {
          respondentId = newResp?.id ?? null
        }
      }

      // Convert scores
      const scores: Record<string, number> = {}
      const scoreKeys = ['le1', 'le2', 'le3', 'ce1', 'ce2', 'ce3', 'ie1', 'ie2', 'ie3', 've1', 've2']
      for (const key of scoreKeys) {
        if (row[key]) {
          scores[key] = convertScore(row[key]!)
        }
      }

      // Create course_survey_responses using array-based score fields
      if (surveyId && respondentId) {
        const leScores = [scores.le1, scores.le2, scores.le3].filter(v => v != null && v > 0) as number[]
        const ceScores = [scores.ce1, scores.ce2, scores.ce3].filter(v => v != null && v > 0) as number[]
        const ieScores = [scores.ie1, scores.ie2, scores.ie3].filter(v => v != null && v > 0) as number[]
        const veScores = [scores.ve1, scores.ve2].filter(v => v != null && v > 0) as number[]

        const openAnswers: Record<string, string> = {}
        if (row.open_positive?.trim()) openAnswers.positive = row.open_positive.trim()
        if (row.open_improve?.trim()) openAnswers.improve = row.open_improve.trim()

        const futureCourses = row.future_courses?.trim() ? [row.future_courses.trim()] : []

        await sc.from('course_survey_responses').insert({
          survey_id: surveyId,
          respondent_id: respondentId,
          learning_effect_scores: leScores,
          course_scores: ceScores,
          instructor_scores: ieScores,
          venue_scores: veScores,
          open_answers: openAnswers,
          future_courses: futureCourses,
        })
      }

      // Match or create profile
      let profileId: string | null = null

      if (company_id) {
        // Try to match by name in company
        const match = companyProfiles.find(p => p.full_name === name)
        if (match) {
          profileId = match.id
        }
      }

      if (!profileId && email) {
        // Check if profile with this email exists
        const { data: byEmail } = await sc
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (byEmail) {
          profileId = byEmail.id
        }
        // Note: Cannot create profiles without auth user id - profile linking
        // requires manual user creation. Record will still have survey data via respondent.
      }

      // Create course_enrollments
      if (profileId && resolvedCourseId && company_id) {
        const { data: existingEnroll } = await sc
          .from('course_enrollments')
          .select('id')
          .eq('course_id', resolvedCourseId)
          .eq('employee_id', profileId)
          .maybeSingle()

        if (!existingEnroll) {
          const { error: enrollErr } = await sc.from('course_enrollments').insert({
            course_id: resolvedCourseId,
            employee_id: profileId,
            company_id: company_id,
            status: 'completed',
          })
          if (!enrollErr) enrollmentsCreated++
        }
      }

      success++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`第 ${rowNum} 筆：${msg}`)
      failed++
    }
  }

  return NextResponse.json({
    success,
    failed,
    studentsCreated,
    enrollmentsCreated,
    errors,
  })
}
