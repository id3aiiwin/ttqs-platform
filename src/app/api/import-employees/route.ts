import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * POST /api/import-employees
 * CSV 格式：姓名,email,角色,部門名稱,職稱,到職日,生日
 * 角色：consultant, admin, instructor, supervisor, analyst, hr, manager, employee, student
 * companyId 為選填，個人學員/講師/分析師可不填
 */
export async function POST(request: NextRequest) {
  try {
    const { companyId, csvText } = await request.json()
    if (!csvText) {
      return NextResponse.json({ error: '缺少 CSV 資料' }, { status: 400 })
    }

    const sc = createServiceClient()

    // 取得企業部門（如果有指定企業）
    const { data: departments } = companyId
      ? await sc.from('departments').select('id, name').eq('company_id', companyId)
      : { data: [] }
    const deptMap: Record<string, string> = {}
    departments?.forEach(d => { deptMap[d.name] = d.id })

    // 解析 CSV
    const lines = csvText.split('\n').map((l: string) => l.trim()).filter((l: string) => l)
    // 跳過標題行（如果有）
    const startIdx = lines[0]?.includes('姓名') || lines[0]?.includes('email') || lines[0]?.includes('name') ? 1 : 0

    const results: { success: number; failed: number; errors: string[] } = { success: 0, failed: 0, errors: [] }

    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(',').map((s: string) => s.trim())
      const [fullName, email, role, deptName, jobTitle, hireDate, birthday] = parts

      if (!fullName || !email) {
        results.errors.push(`第 ${i + 1} 行：姓名或 email 缺失`)
        results.failed++
        continue
      }

      // 驗證 email 格式
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        results.errors.push(`第 ${i + 1} 行：email 格式錯誤 (${email})`)
        results.failed++
        continue
      }

      const ALL_ROLES = ['consultant', 'admin', 'instructor', 'supervisor', 'analyst', 'hr', 'manager', 'employee', 'student']
      const validRole = ALL_ROLES.includes(role) ? role : 'employee'
      const departmentId = deptName ? (deptMap[deptName] ?? null) : null
      const validHireDate = hireDate && /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(hireDate) ? hireDate.replace(/\//g, '-') : null
      const validBirthday = birthday && /^\d{4}[-/]\d{2}[-/]\d{2}$/.test(birthday) ? birthday.replace(/\//g, '-') : null

      // 建立 Supabase Auth 帳號（預設密碼）
      const { data: authUser, error: authError } = await sc.auth.admin.createUser({
        email,
        password: 'id3a',
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

      if (authError) {
        // 如果帳號已存在，嘗試更新 profile
        if (authError.message?.includes('already been registered')) {
          const { data: existing } = await sc.from('profiles').select('id').eq('email', email).single()
          if (existing) {
            await sc.from('profiles').update({
              full_name: fullName,
              role: validRole as 'consultant' | 'admin' | 'instructor' | 'supervisor' | 'analyst' | 'hr' | 'manager' | 'employee' | 'student',
              company_id: companyId || null,
              department_id: departmentId,
              job_title: jobTitle || null,
              hire_date: validHireDate,
              birthday: validBirthday,
            }).eq('id', existing.id)
            results.success++
            continue
          }
        }
        results.errors.push(`第 ${i + 1} 行：${authError.message} (${email})`)
        results.failed++
        continue
      }

      // 更新 profile（trigger 應已建立基本 profile）
      if (authUser?.user) {
        await sc.from('profiles').update({
          full_name: fullName,
          role: validRole as 'consultant' | 'admin' | 'instructor' | 'supervisor' | 'analyst' | 'hr' | 'manager' | 'employee' | 'student',
          company_id: companyId || null,
          department_id: departmentId,
          job_title: jobTitle || null,
          hire_date: validHireDate,
          birthday: validBirthday,
        }).eq('id', authUser.user.id)
      }

      results.success++
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
