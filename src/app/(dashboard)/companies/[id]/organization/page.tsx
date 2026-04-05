import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OrgChart } from '@/components/organization/org-chart'
import { EmployeeTable } from '@/components/organization/employee-table'
import { OrgDeptFilter } from '@/components/organization/org-dept-filter'
import { ImportEmployeesButton } from '@/components/company/import-employees-button'

export const metadata = { title: '組織架構 | ID3A 管理平台' }

const ROLE_LABELS: Record<string, string> = { consultant: '顧問', hr: 'HR', manager: '主管', employee: '員工' }

export default async function OrganizationPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ dept?: string }> }) {
  const { id: companyId } = await params
  const { dept: filterDept } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant' && profile?.role !== 'hr') redirect('/dashboard')

  const sc = createServiceClient()
  const { data: company } = await sc.from('companies').select('id, name').eq('id', companyId).single()
  if (!company) notFound()

  const { data: departments } = await sc.from('departments')
    .select('id, name, manager_id, is_active')
    .eq('company_id', companyId)
    .order('sort_order')

  const { data: employees } = await sc.from('profiles')
    .select('id, full_name, email, role, department_id, created_at')
    .eq('company_id', companyId)
    .order('full_name')

  const deptMap: Record<string, { name: string; managerId: string | null }> = {}
  departments?.forEach((d) => { deptMap[d.id] = { name: d.name, managerId: d.manager_id } })

  // 統計
  const total = employees?.length ?? 0
  const hrCount = employees?.filter((e) => e.role === 'hr').length ?? 0
  const managerCount = employees?.filter((e) => e.role === 'manager').length ?? 0
  const employeeCount = employees?.filter((e) => e.role === 'employee').length ?? 0
  const unassigned = employees?.filter((e) => !e.department_id).length ?? 0

  // 按部門分組
  const byDept: Record<string, typeof employees> = { __unassigned: [] }
  departments?.forEach((d) => { byDept[d.id] = [] })
  employees?.forEach((e) => {
    const key = e.department_id && byDept[e.department_id] ? e.department_id : '__unassigned'
    byDept[key]!.push(e)
  })

  const filteredEmployees = filterDept
    ? filterDept === '__unassigned'
      ? employees?.filter((e) => !e.department_id) ?? []
      : employees?.filter((e) => e.department_id === filterDept) ?? []
    : employees ?? []

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${companyId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回工作區
        </Link>
        <div className="flex items-center justify-between mt-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">組織架構</h1>
            <p className="text-gray-500 text-sm mt-1">{company.name}</p>
          </div>
          {profile?.role === 'consultant' && <ImportEmployeesButton companyId={companyId} />}
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardBody>
          <p className="text-xs text-gray-400">總人數</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs text-gray-400">角色分布</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs">HR <strong>{hrCount}</strong></span>
            <span className="text-xs">主管 <strong>{managerCount}</strong></span>
            <span className="text-xs">員工 <strong>{employeeCount}</strong></span>
          </div>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs text-gray-400">部門數</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{departments?.filter((d) => d.is_active).length ?? 0}</p>
        </CardBody></Card>
        <Card><CardBody>
          <p className="text-xs text-gray-400">未分配部門</p>
          <p className={`text-2xl font-bold mt-1 ${unassigned > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{unassigned}</p>
          {unassigned > 0 && <p className="text-xs text-amber-500 mt-0.5">需要分配</p>}
        </CardBody></Card>
      </div>

      {/* 組織架構圖 */}
      <Card className="mb-6">
        <CardHeader><p className="font-semibold text-gray-900">組織架構圖</p></CardHeader>
        <CardBody>
          <OrgChart
            departments={departments ?? []}
            byDept={byDept}
            deptMap={deptMap}
            companyId={companyId}
          />
        </CardBody>
      </Card>

      {/* 員工列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">員工列表</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">篩選部門：</span>
              <OrgDeptFilter companyId={companyId} departments={departments ?? []} current={filterDept ?? ''} />
            </div>
          </div>
        </CardHeader>
        <EmployeeTable
          employees={filteredEmployees}
          departments={departments ?? []}
          deptMap={deptMap}
          companyId={companyId}
          isConsultant={profile?.role === 'consultant'}
        />
      </Card>
    </div>
  )
}

