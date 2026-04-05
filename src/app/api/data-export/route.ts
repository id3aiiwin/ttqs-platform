import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

const BOM = '\uFEFF'

function toCsv(headers: string[], rows: Record<string, unknown>[], keys: string[]): string {
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(keys.map(k => escape(row[k])).join(','))
  }
  return BOM + lines.join('\n')
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '未登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: '權限不足' }, { status: 403 })
  }

  const type = req.nextUrl.searchParams.get('type')
  const sc = createServiceClient()
  let csv = ''
  let filename = ''

  try {
    switch (type) {
      case 'companies': {
        const { data } = await sc.from('companies').select('id, name, status, industry, created_at').order('created_at', { ascending: false })
        csv = toCsv(['ID', '名稱', '狀態', '產業', '建立時間'], data ?? [], ['id', 'name', 'status', 'industry', 'created_at'])
        filename = 'companies.csv'
        break
      }
      case 'profiles': {
        const { data } = await sc.from('profiles').select('id, full_name, email, role, roles, company_id, phone, birthday, created_at').order('created_at', { ascending: false })
        const rows = (data ?? []).map(r => ({ ...r, roles: Array.isArray(r.roles) ? r.roles.join(';') : r.roles }))
        csv = toCsv(['ID', '姓名', '信箱', '角色', '角色列表', '企業ID', '電話', '生日', '建立時間'], rows, ['id', 'full_name', 'email', 'role', 'roles', 'company_id', 'phone', 'birthday', 'created_at'])
        filename = 'profiles.csv'
        break
      }
      case 'courses': {
        const { data } = await sc.from('courses').select('id, title, status, course_type, start_date, hours, trainer, company_id, total_revenue, created_at').order('created_at', { ascending: false })
        csv = toCsv(['ID', '標題', '狀態', '課程類型', '開始日期', '時數', '講師', '企業ID', '總收入', '建立時間'], data ?? [], ['id', 'title', 'status', 'course_type', 'start_date', 'hours', 'trainer', 'company_id', 'total_revenue', 'created_at'])
        filename = 'courses.csv'
        break
      }
      case 'survey_responses': {
        const { data } = await sc.from('course_survey_responses').select('*, course_surveys(course_id, courses(title))').order('submitted_at', { ascending: false })
        const rows = (data ?? []).map((r: Record<string, unknown>) => {
          const survey = r.course_surveys as Record<string, unknown> | null
          const course = survey?.courses as Record<string, unknown> | null
          const learningScores = r.learning_effect_scores as number[] | null
          const courseScores = r.course_scores as number[] | null
          const instructorScores = r.instructor_scores as number[] | null
          const venueScores = r.venue_scores as number[] | null
          return {
            id: r.id,
            course_name: course?.title ?? '',
            respondent_id: r.respondent_id,
            learning_effect: learningScores?.join(';') ?? '',
            course_scores: courseScores?.join(';') ?? '',
            instructor_scores: instructorScores?.join(';') ?? '',
            venue_scores: venueScores?.join(';') ?? '',
            submitted_at: r.submitted_at,
          }
        })
        csv = toCsv(['ID', '課程名稱', '填答者ID', '學習成效', '課程評分', '講師評分', '場地評分', '提交時間'], rows, ['id', 'course_name', 'respondent_id', 'learning_effect', 'course_scores', 'instructor_scores', 'venue_scores', 'submitted_at'])
        filename = 'survey_responses.csv'
        break
      }
      case 'interactions': {
        const { data } = await sc.from('interactions').select('id, target_id, contact_date, contact_type, subject, content, next_action').order('contact_date', { ascending: false })
        csv = toCsv(['ID', '對象ID', '聯繫日期', '聯繫方式', '主題', '內容', '後續動作'], data ?? [], ['id', 'target_id', 'contact_date', 'contact_type', 'subject', 'content', 'next_action'])
        filename = 'interactions.csv'
        break
      }
      case 'todos': {
        const { data } = await sc.from('todos').select('id, title, status, priority, due_date, assigned_to, created_at').order('created_at', { ascending: false })
        csv = toCsv(['ID', '標題', '狀態', '優先級', '到期日', '負責人', '建立時間'], data ?? [], ['id', 'title', 'status', 'priority', 'due_date', 'assigned_to', 'created_at'])
        filename = 'todos.csv'
        break
      }
      default:
        return NextResponse.json({ error: '不支援的匯出類型' }, { status: 400 })
    }
  } catch (e) {
    console.error('Data export error:', e)
    return NextResponse.json({ error: '匯出過程發生錯誤' }, { status: 500 })
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
