import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'

export async function POST(request: NextRequest) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await getProfile(user.id)
  if (!profile || !['consultant', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { companyId, csvText } = await request.json()
    if (!csvText) {
      return NextResponse.json({ error: '缺少 CSV 資料' }, { status: 400 })
    }

    const sc = createServiceClient()

    const { data: departments } = companyId
      ? await sc.from('departments').select('id, name').eq('company_id', companyId)
      : { data: [] }
    const deptMap: Record<string, string> = {}
    departments?.forEach(d => { deptMap[d.name] = d.id })

    const lines = csvText.split('\n').map((l: string) => l.trim()).filter((l: string) => l)
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

      const { data: authUser, error: authError } = await sc.auth.admin.createUser({
        email,
        password: '1234',
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

      if (authError) {
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
