import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExportButton } from '@/components/ui/export-button'

export const metadata = { title: '企業儀表板 | ID3A 管理平台' }

function StatCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <Card><CardBody>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </CardBody></Card>
  )
}

export default async function CompanyDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()
  const { data: company } = await sc.from('companies').select('*').eq('id', companyId).single()
  if (!company) notFound()

  const { data: employees } = await sc.from('profiles').select('id, full_name, email, role, department_id').eq('company_id', companyId)
  const { data: courses } = await sc.from('courses').select('id, title, status, start_date, hours, trainer').eq('company_id', companyId).order('created_at', { ascending: false })
  const { data: documents } = await sc.from('company_documents').select('id, title, tier, status').eq('company_id', companyId)
  const { data: departments } = await sc.from('departments').select('id, name, manager_id').eq('company_id', companyId)

  const totalEmp = employees?.length ?? 0
  const hrCount = employees?.filter(e => e.role === 'hr').length ?? 0
  const managerCount = employees?.filter(e => e.role === 'manager').length ?? 0
  const totalCourses = courses?.length ?? 0
  const activeCourses = courses?.filter(c => c.status === 'in_progress').length ?? 0
  const completedCourses = courses?.filter(c => c.status === 'completed').length ?? 0
  const totalDocs = documents?.length ?? 0
  const approvedDocs = documents?.filter(d => d.status === 'approved').length ?? 0

  const deptMap: Record<string, string> = {}
  departments?.forEach(d => { deptMap[d.id] = d.name })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${companyId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回工作區
        </Link>
        <div className="flex items-center justify-between mt-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">企業儀表板</h1>
            <p className="text-gray-500 text-sm mt-1">{company.name} — 顧問視角（等同 HR 看到的內容）</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton type="employees" companyId={companyId} label="匯出員工" />
            <ExportButton type="courses" companyId={companyId} label="匯出課程" />
            <ExportButton type="documents" companyId={companyId} label="匯出文件" />
          </div>
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="員工人數" value={totalEmp} sub={`HR ${hrCount} / 主管 ${managerCount}`} color="text-gray-900" />
        <StatCard label="總課程數" value={totalCourses} sub={`進行中 ${activeCourses}`} color="text-indigo-600" />
        <StatCard label="已完成課程" value={completedCourses} color="text-green-600" />
        <StatCard label="文件完成" value={approvedDocs} sub={`/ ${totalDocs} 份`} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 課程列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">課程列表</p>
              <Link href="/courses" className="text-xs text-indigo-600 hover:text-indigo-700">查看全部</Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {(courses ?? []).slice(0, 10).map(c => (
              <div key={c.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.start_date ?? '未排期'}{c.trainer ? ` · ${c.trainer}` : ''}</p>
                </div>
                <Badge variant={c.status === 'completed' ? 'success' : c.status === 'in_progress' ? 'warning' : 'default'}>
                  {c.status === 'completed' ? '已完成' : c.status === 'in_progress' ? '進行中' : '規劃中'}
                </Badge>
              </div>
            ))}
            {(!courses || courses.length === 0) && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無課程</p>}
          </div>
        </Card>

        {/* 員工列表 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">員工列表</p>
              <Link href={`/companies/${companyId}/employees`} className="text-xs text-indigo-600 hover:text-indigo-700">查看全部</Link>
            </div>
          </CardHeader>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {(employees ?? []).map(e => (
              <div key={e.id} className="px-6 py-2.5 flex items-center gap-3">
                <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-indigo-700">{(e.full_name || e.email).charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{e.full_name || e.email}</p>
                  <p className="text-xs text-gray-400">{deptMap[e.department_id ?? ''] ?? '未分配'}</p>
                </div>
                <Badge variant={e.role === 'hr' ? 'info' : e.role === 'manager' ? 'warning' : 'default'}>
                  {e.role === 'hr' ? 'HR' : e.role === 'manager' ? '主管' : '員工'}
                </Badge>
                <Link href={`/companies/${companyId}/employees/${e.id}/passport`}
                  className="text-xs text-indigo-600 hover:text-indigo-700">履歷</Link>
              </div>
            ))}
            {(!employees || employees.length === 0) && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無員工</p>}
          </div>
        </Card>

        {/* 部門統計 */}
        <Card>
          <CardHeader><p className="font-semibold text-gray-900">部門概況</p></CardHeader>
          <div className="divide-y divide-gray-100">
            {(departments ?? []).map(d => {
              const deptEmp = employees?.filter(e => e.department_id === d.id) ?? []
              const manager = employees?.find(e => e.id === d.manager_id)
              return (
                <div key={d.id} className="px-6 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{d.name}</p>
                    <span className="text-xs text-gray-400">{deptEmp.length} 人</span>
                  </div>
                  {manager && <p className="text-xs text-gray-500 mt-0.5">主管：{manager.full_name || manager.email}</p>}
                </div>
              )
            })}
            {(!departments || departments.length === 0) && <p className="px-6 py-8 text-sm text-gray-400 text-center">尚無部門</p>}
          </div>
        </Card>

        {/* 文件進度 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">文件完成進度</p>
              <Link href={`/companies/${companyId}/documents`} className="text-xs text-indigo-600 hover:text-indigo-700">查看全部</Link>
            </div>
          </CardHeader>
          <CardBody>
            {[1, 2, 3, 4].map(tier => {
              const tierDocs = documents?.filter(d => d.tier === tier) ?? []
              const tierApproved = tierDocs.filter(d => d.status === 'approved').length
              const tierLabels = ['', '一階', '二階', '三階', '四階']
              return (
                <div key={tier} className="flex items-center gap-3 mb-3 last:mb-0">
                  <span className="text-xs text-gray-500 w-8">{tierLabels[tier]}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${tierDocs.length > 0 ? (tierApproved / tierDocs.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">{tierApproved}/{tierDocs.length}</span>
                </div>
              )
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
