import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  LEARNING_EFFECT, COURSE_EVAL, INSTRUCTOR_EVAL, VENUE_EVAL,
  OPEN_QUESTIONS, SECTION_LABELS, SCORE_LABELS,
} from '@/lib/survey-questions'

/**
 * POST /api/ai-survey-analysis
 * body: { course_id: string }
 * 用 Claude API 分析課程滿意度問卷
 */
export async function POST(request: NextRequest) {
  try {
    const { course_id } = await request.json()
    if (!course_id) return NextResponse.json({ error: '缺少 course_id' }, { status: 400 })

    const sc = createServiceClient()

    // 取得課程資訊
    const { data: course } = await sc.from('courses').select('title, trainer, start_date, hours').eq('id', course_id).single()
    if (!course) return NextResponse.json({ error: '找不到課程' }, { status: 404 })

    // 取得問卷回應
    const { data: survey } = await sc.from('course_surveys').select('id').eq('course_id', course_id).single()
    if (!survey) return NextResponse.json({ error: '此課程尚無問卷' }, { status: 404 })

    const { data: responses } = await sc.from('course_survey_responses').select('*').eq('survey_id', survey.id)
    if (!responses || responses.length === 0) {
      return NextResponse.json({ error: '尚無問卷回應' }, { status: 404 })
    }

    // 計算統計數據
    const count = responses.length

    function calcAvg(scores: number[]): number {
      if (scores.length === 0) return 0
      return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
    }

    function analyzeSection(allScores: number[][], questions: string[]) {
      return questions.map((q, i) => {
        const scores = allScores.map(s => s[i]).filter(s => s != null)
        return { question: q, avg: calcAvg(scores), count: scores.length }
      })
    }

    const learningStats = analyzeSection(responses.map(r => r.learning_effect_scores), LEARNING_EFFECT)
    const courseStats = analyzeSection(responses.map(r => r.course_scores), COURSE_EVAL)
    const instructorStats = analyzeSection(responses.map(r => r.instructor_scores), INSTRUCTOR_EVAL)
    const venueStats = analyzeSection(responses.map(r => r.venue_scores), VENUE_EVAL)

    const overallAvg = calcAvg([
      ...learningStats.map(s => s.avg),
      ...courseStats.map(s => s.avg),
      ...instructorStats.map(s => s.avg),
      ...venueStats.map(s => s.avg),
    ])

    // 收集開放式回答
    const openAnswers: Record<string, string[]> = {}
    OPEN_QUESTIONS.forEach(q => { openAnswers[q.label] = [] })
    responses.forEach(r => {
      const answers = r.open_answers as Record<string, string>
      OPEN_QUESTIONS.forEach(q => {
        if (answers?.[q.key]) openAnswers[q.label].push(answers[q.key])
      })
    })

    // 未來課程需求
    const futureCounts: Record<string, number> = {}
    responses.forEach(r => {
      (r.future_courses as string[])?.forEach(c => {
        futureCounts[c] = (futureCounts[c] ?? 0) + 1
      })
    })
    const topFuture = Object.entries(futureCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // 組裝 prompt
    const prompt = `你是一位專業的 TTQS 訓練品質顧問。請根據以下課程滿意度問卷統計資料，產出一份完整的分析報告。

## 課程資訊
- 課程名稱：${course.title}
- 講師：${course.trainer ?? '未記錄'}
- 日期：${course.start_date ?? '未記錄'}
- 時數：${course.hours ?? '未記錄'} 小時
- 填答人數：${count} 人

## 量化評分（1-5分，${SCORE_LABELS.join('/')}）

### ${SECTION_LABELS.learning_effect}（整體平均 ${calcAvg(learningStats.map(s => s.avg))} 分）
${learningStats.map(s => `- ${s.question}：${s.avg} 分`).join('\n')}

### ${SECTION_LABELS.course}（整體平均 ${calcAvg(courseStats.map(s => s.avg))} 分）
${courseStats.map(s => `- ${s.question}：${s.avg} 分`).join('\n')}

### ${SECTION_LABELS.instructor}（整體平均 ${calcAvg(instructorStats.map(s => s.avg))} 分）
${instructorStats.map(s => `- ${s.question}：${s.avg} 分`).join('\n')}

### ${SECTION_LABELS.venue}（整體平均 ${calcAvg(venueStats.map(s => s.avg))} 分）
${venueStats.map(s => `- ${s.question}：${s.avg} 分`).join('\n')}

### 綜合平均：${overallAvg} 分

## 開放式回答
${OPEN_QUESTIONS.map(q => {
  const answers = openAnswers[q.label]
  return `### ${q.label}\n${answers.length > 0 ? answers.map(a => `- ${a}`).join('\n') : '（無回答）'}`
}).join('\n\n')}

## 未來期望課程（前5名）
${topFuture.map(([name, cnt]) => `- ${name}（${cnt} 人次）`).join('\n')}

---

請以繁體中文產出以下分析：
1. **整體摘要**（2-3 句話概述此課程的滿意度表現）
2. **亮點分析**（哪些項目表現特別好，引用具體分數）
3. **待改善項目**（哪些項目分數較低，建議改善方向）
4. **學員回饋洞察**（從開放式回答中歸納出的關鍵主題和學員心聲）
5. **具體改善建議**（3-5 點可操作的建議）
6. **未來訓練規劃建議**（根據學員期望課程的建議）

格式請用 Markdown。`

    // 呼叫 Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const analysisText = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({
      analysis: analysisText,
      stats: {
        count,
        overallAvg,
        sections: {
          learning_effect: { label: SECTION_LABELS.learning_effect, avg: calcAvg(learningStats.map(s => s.avg)), items: learningStats },
          course: { label: SECTION_LABELS.course, avg: calcAvg(courseStats.map(s => s.avg)), items: courseStats },
          instructor: { label: SECTION_LABELS.instructor, avg: calcAvg(instructorStats.map(s => s.avg)), items: instructorStats },
          venue: { label: SECTION_LABELS.venue, avg: calcAvg(venueStats.map(s => s.avg)), items: venueStats },
        },
        topFutureCourses: topFuture,
      },
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    return NextResponse.json({ error: '分析失敗：' + (error as Error).message }, { status: 500 })
  }
}
