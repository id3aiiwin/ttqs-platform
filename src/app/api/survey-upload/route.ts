import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/survey-upload
 * body: { course_id, csv_text }
 * 解析 SurveyCake CSV，轉換為滿意度問卷資料
 */

// 文字轉分數對映（統一五級制）
const SCORE_MAP: Record<string, number> = {
  '非常同意': 100, '同意': 80, '普通': 60, '不同意': 40, '非常不同意': 20,
  '非常高': 100, '高度': 80, '中度': 60, '低度': 40, '非常低': 20,
  '5': 100, '4': 80, '3': 60, '2': 40, '1': 20,
}

function toScore(val: string): number {
  const trimmed = val.trim()
  return SCORE_MAP[trimmed] ?? (Number(trimmed) || 0)
}

function avg(scores: number[]): number {
  if (scores.length === 0) return 0
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
}

export async function POST(request: NextRequest) {
  try {
    const { course_id, csv_text } = await request.json()
    if (!course_id || !csv_text) return NextResponse.json({ error: '缺少參數' }, { status: 400 })

    const sc = createServiceClient()

    // 解析 CSV
    const lines = csv_text.split('\n').map((l: string) => l.trim()).filter((l: string) => l)
    if (lines.length < 2) return NextResponse.json({ error: 'CSV 至少需要標題行和一筆資料' }, { status: 400 })

    // 解析標題行
    const headers = parseCSVLine(lines[0])

    // 找到對應的欄位索引
    const colMap = {
      name: findCol(headers, '姓名'),
      birthday: findCol(headers, '生日'),
      company: findCol(headers, '企業'),
      email: findCol(headers, '電郵'),
      courseName: findCol(headers, '課程名稱'),
      instructor: findCol(headers, '授課導師'),
      // 開放性問題
      open1: findCol(headers, '今天的課程內容'),
      open2: findCol(headers, '課程讓你有發現'),
      open3: findCol(headers, '如何應用在生活'),
      open4: findCol(headers, '有沒有其他問題'),
      // 學習效果 4 題
      le1: findCol(headers, '課程主題與內容切合度'),
      le2: findCol(headers, '對研習內容瞭解吸收'),
      le3: findCol(headers, '學習到新的知識'),
      le4: findCol(headers, '未來工作上實際應用'),
      // 課程評價 6 題
      ce1: findCol(headers, '學習目標說明清楚'),
      ce2: findCol(headers, '學習內容對工作有幫助'),
      ce3: findCol(headers, '學習內容條理分明'),
      ce4: findCol(headers, '例子、問答、個案'),
      ce5: findCol(headers, '課程難易安排'),
      ce6: findCol(headers, '課程符合產業'),
      // 講師評價 10 題
      ie1: findCol(headers, '講師準備充分'),
      ie2: findCol(headers, '講師具備足夠'),
      ie3: findCol(headers, '講師溝通技巧'),
      ie4: findCol(headers, '內容介紹有組織'),
      ie5: findCol(headers, '鼓勵學員參與'),
      ie6: findCol(headers, '幫助學員克服'),
      ie7: findCol(headers, '提供學員積極'),
      ie8: findCol(headers, '引導課程滿足'),
      ie9: findCol(headers, '教學方法能引發'),
      ie10: findCol(headers, '教學進度掌握'),
      // 未來課程
      future: findCol(headers, '期待未來'),
    }

    // 解析每行資料
    const responses: {
      name: string; birthday: string; email: string
      open_answers: Record<string, string>
      learning_effect: number[]; course_scores: number[]; instructor_scores: number[]
      future_courses: string[]
    }[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i])
      if (cols.length < 10) continue

      const get = (idx: number | null) => idx !== null && idx < cols.length ? cols[idx].trim() : ''

      responses.push({
        name: get(colMap.name),
        birthday: get(colMap.birthday),
        email: get(colMap.email),
        open_answers: {
          q1: get(colMap.open1),
          q2: get(colMap.open2),
          q3: get(colMap.open3),
          q4: get(colMap.open4),
        },
        learning_effect: [toScore(get(colMap.le1)), toScore(get(colMap.le2)), toScore(get(colMap.le3)), toScore(get(colMap.le4))],
        course_scores: [toScore(get(colMap.ce1)), toScore(get(colMap.ce2)), toScore(get(colMap.ce3)), toScore(get(colMap.ce4)), toScore(get(colMap.ce5)), toScore(get(colMap.ce6))],
        instructor_scores: [toScore(get(colMap.ie1)), toScore(get(colMap.ie2)), toScore(get(colMap.ie3)), toScore(get(colMap.ie4)), toScore(get(colMap.ie5)), toScore(get(colMap.ie6)), toScore(get(colMap.ie7)), toScore(get(colMap.ie8)), toScore(get(colMap.ie9)), toScore(get(colMap.ie10))],
        future_courses: get(colMap.future).split(/\n|,/).map(s => s.replace(/^\d+\.\s*\d*\.?\s*/, '').trim()).filter(Boolean),
      })
    }

    if (responses.length === 0) return NextResponse.json({ error: '沒有有效的回應資料' }, { status: 400 })

    // 確保有 survey
    let { data: survey } = await sc.from('course_surveys').select('id').eq('course_id', course_id).single()
    if (!survey) {
      const { data: newSurvey } = await sc.from('course_surveys').insert({ course_id, is_active: false }).select('id').single()
      survey = newSurvey
    }
    if (!survey) return NextResponse.json({ error: '無法建立問卷' }, { status: 500 })

    // 寫入每筆回應
    for (const r of responses) {
      await sc.from('course_survey_responses').insert({
        survey_id: survey.id,
        learning_effect_scores: r.learning_effect.map(s => Math.round(s / 20)),
        course_scores: r.course_scores.map(s => Math.round(s / 20)),
        instructor_scores: r.instructor_scores.map(s => Math.round(s / 20)),
        venue_scores: [],
        open_answers: r.open_answers,
        future_courses: r.future_courses,
      })
    }

    // 計算統計摘要
    const allLE = responses.map(r => avg(r.learning_effect))
    const allCE = responses.map(r => avg(r.course_scores))
    const allIE = responses.map(r => avg(r.instructor_scores))

    const stats = {
      count: responses.length,
      learning_effect_avg: avg(allLE),
      course_avg: avg(allCE),
      instructor_avg: avg(allIE),
      overall_avg: avg([avg(allLE), avg(allCE), avg(allIE)]),
    }

    return NextResponse.json({ ok: true, stats, imported: responses.length })
  } catch (error) {
    return NextResponse.json({ error: '解析失敗：' + (error as Error).message }, { status: 500 })
  }
}

// CSV 解析（處理引號內的逗號）
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += c
    }
  }
  result.push(current)
  return result
}

// 模糊匹配欄位名
function findCol(headers: string[], keyword: string): number | null {
  const idx = headers.findIndex(h => h.includes(keyword))
  return idx >= 0 ? idx : null
}
