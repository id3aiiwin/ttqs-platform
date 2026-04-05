import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET: 查詢學員資料（姓名+生日自動填入）
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')
  const birthday = request.nextUrl.searchParams.get('birthday')
  if (!name || !birthday) return NextResponse.json(null)

  const sc = createServiceClient()
  const { data } = await sc.from('survey_respondents')
    .select('id, email, phone, line_id')
    .eq('name', name).eq('birthday', birthday).single()

  return NextResponse.json(data)
}

// POST: 提交問卷
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { surveyId, respondent, scores, openAnswers, futureCourses } = body

  if (!surveyId || !respondent?.name || !respondent?.birthday) {
    return NextResponse.json({ error: '缺少必填欄位' }, { status: 400 })
  }

  const sc = createServiceClient()
  const now = new Date().toISOString()

  // 檢查問卷是否開放
  const { data: survey } = await sc.from('course_surveys')
    .select('id, is_active, course_id').eq('id', surveyId).single()

  if (!survey?.is_active) {
    return NextResponse.json({ error: '此問卷已關閉' }, { status: 400 })
  }

  const courseId = survey.course_id

  // 取得課程的 company_id
  const { data: course } = await sc.from('courses')
    .select('company_id').eq('id', courseId).single()

  // Upsert 學員資料
  const { data: resp } = await sc.from('survey_respondents').upsert({
    name: respondent.name,
    birthday: respondent.birthday,
    email: respondent.email || null,
    phone: respondent.phone || null,
    line_id: respondent.line_id || null,
  }, { onConflict: 'name,birthday' }).select('id').single()

  // 寫入回覆
  const { error } = await sc.from('course_survey_responses').insert({
    survey_id: surveyId,
    respondent_id: resp?.id ?? null,
    learning_effect_scores: scores.learning_effect ?? [],
    course_scores: scores.course ?? [],
    instructor_scores: scores.instructor ?? [],
    venue_scores: scores.venue ?? [],
    open_answers: openAnswers ?? {},
    future_courses: futureCourses ?? [],
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ========================================
  // 連動一：自動加入學習履歷（course_enrollments）
  // ========================================
  let matchedEmployeeId: string | null = null

  if (course?.company_id) {
    // 用姓名比對 profiles（同企業下的員工）
    const { data: matchedProfile } = await sc.from('profiles')
      .select('id')
      .eq('company_id', course.company_id)
      .eq('full_name', respondent.name)
      .single()

    if (matchedProfile) {
      matchedEmployeeId = matchedProfile.id

      // 建立參訓記錄（已存在則跳過）
      await sc.from('course_enrollments').upsert({
        course_id: courseId,
        employee_id: matchedProfile.id,
        company_id: course.company_id,
        status: 'completed',
        completion_date: now.split('T')[0],
      }, { onConflict: 'course_id,employee_id' })
    }
  }

  // ========================================
  // 連動二：自動加入簽到表（course_forms.form_data）
  // ========================================
  const { data: signForm } = await sc.from('course_forms')
    .select('id, form_data, status')
    .eq('course_id', courseId)
    .eq('standard_name', '訓練活動紀錄簽到表')
    .single()

  if (signForm) {
    const existingData = (signForm.form_data ?? {}) as { attendees?: unknown[] }
    const attendees = Array.isArray(existingData.attendees) ? [...existingData.attendees] : []

    attendees.push({
      name: respondent.name,
      birthday: respondent.birthday,
      email: respondent.email || null,
      sign_time: now,
      employee_id: matchedEmployeeId,
    })

    await sc.from('course_forms').update({
      form_data: { attendees } as Record<string, unknown>,
      status: signForm.status === 'pending' ? 'in_progress' : signForm.status,
    }).eq('id', signForm.id)
  }

  // ========================================
  // 連動：更新 PDDRO O 構面滿意度調查為 in_progress
  // ========================================
  await sc.from('course_forms')
    .update({ status: 'in_progress' })
    .eq('course_id', courseId)
    .eq('standard_name', '滿意度調查')
    .eq('status', 'pending')

  return NextResponse.json({ ok: true })
}
