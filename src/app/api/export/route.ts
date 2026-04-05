import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

/**
 * GET /api/export?type=courses|employees|documents|course_students&company_id=xxx
 * 僅顧問可使用，回傳可列印的 HTML 頁面
 */
export async function GET(request: NextRequest) {
  // 權限驗證：僅顧問
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '請先登入' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') {
    return NextResponse.json({ error: '僅顧問可使用匯出功能' }, { status: 403 })
  }

  const type = request.nextUrl.searchParams.get('type')
  const companyId = request.nextUrl.searchParams.get('company_id')

  const sc = createServiceClient()

  let title = '報表'
  let companyName = ''
  let tableHtml = ''

  if (companyId) {
    const { data: company } = await sc.from('companies').select('name').eq('id', companyId).single()
    companyName = company?.name ?? ''
  }

  if (type === 'courses') {
    title = '課程列表'
    let query = sc.from('courses').select('title, status, start_date, end_date, hours, trainer, company_id').order('created_at', { ascending: false })
    if (companyId) query = query.eq('company_id', companyId)
    const { data } = await query

    const companyIds = [...new Set((data ?? []).map(c => c.company_id).filter(Boolean) as string[])]
    const { data: companies } = companyIds.length > 0
      ? await sc.from('companies').select('id, name').in('id', companyIds)
      : { data: [] }
    const cMap: Record<string, string> = {}
    companies?.forEach(c => { cMap[c.id] = c.name })

    const statusLabels: Record<string, string> = { draft: '草稿', planned: '已規劃', in_progress: '進行中', completed: '已完成', cancelled: '已取消' }

    tableHtml = `
      <table>
        <thead><tr><th>課程名稱</th><th>企業</th><th>狀態</th><th>開始日期</th><th>時數</th><th>講師</th></tr></thead>
        <tbody>
          ${(data ?? []).map(c => `<tr>
            <td>${esc(c.title)}</td><td>${esc(c.company_id ? (cMap[c.company_id] ?? '') : '公開課')}</td>
            <td>${esc(statusLabels[c.status] ?? c.status)}</td><td>${esc(c.start_date ?? '')}</td>
            <td>${c.hours ?? ''}</td><td>${esc(c.trainer ?? '')}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
  }

  else if (type === 'employees' && companyId) {
    title = '員工列表'
    const { data: employees } = await sc.from('profiles').select('full_name, email, role, department_id').eq('company_id', companyId)
    const { data: depts } = await sc.from('departments').select('id, name').eq('company_id', companyId)
    const dMap: Record<string, string> = {}
    depts?.forEach(d => { dMap[d.id] = d.name })

    const roleLabels: Record<string, string> = { hr: 'HR', manager: '主管', employee: '員工' }

    tableHtml = `
      <table>
        <thead><tr><th>姓名</th><th>Email</th><th>角色</th><th>部門</th></tr></thead>
        <tbody>
          ${(employees ?? []).map(e => `<tr>
            <td>${esc(e.full_name ?? '')}</td><td>${esc(e.email)}</td>
            <td>${esc(roleLabels[e.role] ?? e.role)}</td><td>${esc(dMap[e.department_id ?? ''] ?? '')}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
  }

  else if (type === 'documents' && companyId) {
    title = '四階文件清單'
    const { data: docs } = await sc.from('company_documents').select('title, doc_number, tier, version, status').eq('company_id', companyId).order('tier').order('title')
    const tierLabels: Record<number, string> = { 1: '一階', 2: '二階', 3: '三階', 4: '四階' }
    const statusLabels: Record<string, string> = { draft: '草稿', pending_review: '待審閱', approved: '已確認' }

    tableHtml = `
      <table>
        <thead><tr><th>階層</th><th>文件編號</th><th>文件名稱</th><th>版本</th><th>狀態</th></tr></thead>
        <tbody>
          ${(docs ?? []).map(d => `<tr>
            <td>${esc(tierLabels[d.tier] ?? '')}</td><td>${esc(d.doc_number ?? '')}</td>
            <td>${esc(d.title)}</td><td>${esc(d.version ?? '')}</td><td>${esc(statusLabels[d.status] ?? d.status)}</td>
          </tr>`).join('')}
        </tbody>
      </table>`
  }

  else if (type === 'course_students') {
    const courseId = request.nextUrl.searchParams.get('course_id')
    if (!courseId) return NextResponse.json({ error: 'missing course_id' }, { status: 400 })

    title = '課程學員資料'
    const { data: course } = await sc.from('courses').select('title, company_id').eq('id', courseId).single()
    if (course) {
      const { data: comp } = course.company_id ? await sc.from('companies').select('name').eq('id', course.company_id).single() : { data: null }
      companyName = comp?.name ?? ''
      title = `${course.title} — 學員資料`
    }

    // 取得該企業所有員工（含擴充欄位）
    const cid = course?.company_id
    const { data: students } = cid
      ? await sc.from('profiles').select('id, full_name, email, role, department_id, job_title, hire_date, birthday, r1_pattern, l2_pattern').eq('company_id', cid)
      : { data: [] }

    // Check which students have full talent assessments
    const studentIds = (students ?? []).map(s => s.id).filter(Boolean) as string[]
    const { data: assessments } = studentIds.length > 0
      ? await sc.from('talent_assessments').select('profile_id').in('profile_id', studentIds)
      : { data: [] }
    const assessedIds = new Set((assessments ?? []).map(a => a.profile_id))

    const { data: depts } = cid
      ? await sc.from('departments').select('id, name').eq('company_id', cid)
      : { data: [] }
    const dMap: Record<string, string> = {}
    depts?.forEach(d => { dMap[d.id] = d.name })

    function calcYears(dateStr: string | null): string {
      if (!dateStr) return ''
      const diff = new Date().getTime() - new Date(dateStr).getTime()
      const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
      return `${years} 年`
    }

    tableHtml = `
      <table>
        <thead><tr><th>姓名</th><th>部門</th><th>職稱</th><th>年資</th><th>到職日</th><th>生日</th><th>Email</th><th>R1 管理力</th><th>L2 心像力</th><th>完整評量</th></tr></thead>
        <tbody>
          ${(students ?? []).map(e => `<tr>
            <td>${esc(e.full_name ?? '')}</td>
            <td>${esc(dMap[e.department_id ?? ''] ?? '')}</td>
            <td>${esc(e.job_title ?? '')}</td>
            <td>${esc(calcYears(e.hire_date))}</td>
            <td>${esc(e.hire_date ?? '')}</td>
            <td>${esc(e.birthday ?? '')}</td>
            <td>${esc(e.email)}</td>
            <td>${esc(e.r1_pattern ?? '')}</td>
            <td>${esc(e.l2_pattern ?? '')}</td>
            <td>${assessedIds.has(e.id) ? '\u2713' : ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <p style="margin-top:16px;font-size:12px;color:#888;">
        提供給講師作為課程設計參考，請妥善保管個人資料。
      </p>`
  }

  else {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 })
  }

  const fullTitle = companyName ? `${companyName} — ${title}` : title
  const now = new Date().toLocaleDateString('zh-TW')

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
  <title>${esc(fullTitle)}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none !important; } }
    body { font-family: 'Microsoft JhengHei', 'PingFang TC', sans-serif; padding: 40px; color: #333; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .subtitle { font-size: 12px; color: #888; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 12px; border: 1px solid #e5e7eb; font-weight: 600; }
    td { padding: 6px 12px; border: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #fafafa; }
    .actions { margin-bottom: 20px; }
    .btn { padding: 8px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .btn:hover { background: #4338ca; }
  </style>
</head>
<body>
  <div class="no-print actions">
    <button class="btn" onclick="window.print()">列印 / 儲存為 PDF</button>
    <button class="btn" style="background:#6b7280;margin-left:8px" onclick="window.close()">關閉</button>
  </div>
  <h1>${esc(fullTitle)}</h1>
  <p class="subtitle">匯出日期：${now}</p>
  ${tableHtml}
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
