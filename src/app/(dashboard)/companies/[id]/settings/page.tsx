import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { CompanyForm } from '@/components/company/company-form'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { updateCompany, deleteCompany } from '../../actions'
import { DeleteCompanyButton } from '@/components/company/delete-company-button'
import { DepartmentManager } from '@/components/company/department-manager'
import { DocCodeSetting } from '@/components/company/doc-code-setting'
import { SignatureManager } from '@/components/company/signature-manager'
import { ApprovalFlowEditor } from '@/components/approval/approval-flow-editor'
import { AnnualSettingsForm } from '@/components/company/annual-settings-form'
import { OrgChartUpload } from '@/components/company/org-chart-upload'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '企業設定 | ID3A 管理平台' }

export default async function CompanySettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile || profile.role !== 'consultant') redirect('/dashboard')

  const sc = createServiceClient()
  const { data: company } = await sc.from('companies').select('*').eq('id', id).single()
  if (!company) notFound()

  const { data: departments } = await sc.from('departments')
    .select('id, name, manager_id, sort_order, is_active, parent_id')
    .eq('company_id', id)
    .order('sort_order')

  // 所有員工（含員工數統計 + 主管選單）
  const { data: allProfiles } = await sc.from('profiles')
    .select('id, full_name, email, department_id')
    .eq('company_id', id)

  const deptEmployeeCount: Record<string, number> = {}
  allProfiles?.forEach((p) => {
    if (p.department_id) {
      deptEmployeeCount[p.department_id] = (deptEmployeeCount[p.department_id] ?? 0) + 1
    }
  })

  const people = (allProfiles ?? []).map((p) => ({ id: p.id, name: p.full_name || p.email }))

  // 電子簽名
  const { data: signers } = await sc.from('company_signers')
    .select('id, signer_role, signer_name, signature_url, profile_id')
    .eq('company_id', id)
    .order('sort_order')

  // 簽核流程
  const { data: approvalFlows } = await sc.from('approval_flows')
    .select('id, name, steps, is_default')
    .eq('company_id', id)
    .order('created_at')

  const signerRoles = (signers ?? []).map(s => s.signer_role)

  const updateWithId = updateCompany.bind(null, id)

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回工作區
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">企業設定</h1>
        <p className="text-gray-500 text-sm mt-1">{company.name}</p>
      </div>

      {/* 基本資料 */}
      <Card className="mb-6">
        <CardHeader><p className="font-semibold text-gray-900">基本資料</p></CardHeader>
        <CardBody>
          <CompanyForm action={updateWithId} defaultValues={company} submitLabel="儲存變更" />
        </CardBody>
      </Card>

      {/* 文件管理設定 */}
      <Card className="mb-6">
        <CardHeader><p className="font-semibold text-gray-900">文件管理設定</p></CardHeader>
        <CardBody>
          <DocCodeSetting companyId={id} currentCode={(company as Record<string, unknown>).doc_code as string | null} />
        </CardBody>
      </Card>

      {/* 年度設定 */}
      <Card className="mb-6">
        <CardHeader><p className="font-semibold text-gray-900">年度設定</p></CardHeader>
        <CardBody>
          <AnnualSettingsForm companyId={id} settings={(company as Record<string, unknown>).annual_settings as Record<string, unknown> ?? {}} />
        </CardBody>
      </Card>

      {/* 組織圖 */}
      <Card className="mb-6">
        <CardHeader><p className="font-semibold text-gray-900">組織圖</p></CardHeader>
        <CardBody>
          <OrgChartUpload companyId={id} />
        </CardBody>
      </Card>

      {/* 部門管理 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">部門管理</p>
            <span className="text-xs text-gray-400">{departments?.length ?? 0} 個部門</span>
          </div>
        </CardHeader>
        <DepartmentManager
          companyId={id}
          departments={(departments ?? []).map((d) => ({
            ...d,
            employeeCount: deptEmployeeCount[d.id] ?? 0,
          }))}
          people={people}
        />
      </Card>

      {/* 電子簽名 */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">電子簽名</p>
              <p className="text-xs text-gray-400 mt-0.5">上傳各簽核人的電子簽名圖檔，用於文件簽核</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <SignatureManager
            companyId={id}
            signers={(signers ?? []).map((s) => ({
              id: s.id,
              signer_role: s.signer_role,
              signer_name: s.signer_name,
              signature_url: s.signature_url,
              profile_id: s.profile_id,
            }))}
            isConsultant={true}
          />
        </CardBody>
      </Card>

      {/* 簽核流程 */}
      <Card className="mb-6">
        <CardHeader>
          <div>
            <p className="font-semibold text-gray-900">簽核流程</p>
            <p className="text-xs text-gray-400 mt-0.5">設定文件簽核的審批流程與順序</p>
          </div>
        </CardHeader>
        <CardBody>
          <ApprovalFlowEditor
            companyId={id}
            flows={(approvalFlows ?? []).map(f => ({
              id: f.id,
              name: f.name,
              steps: (f.steps as { order: number; signer_role: string }[]) ?? [],
              is_default: f.is_default,
            }))}
            signerRoles={signerRoles.length > 0 ? signerRoles : ['承辦人', '主管', '總經理']}
          />
        </CardBody>
      </Card>

      {/* 危險區域 */}
      <div className="border border-red-200 rounded-xl p-5">
        <p className="text-sm font-medium text-red-700 mb-1">危險區域</p>
        <p className="text-xs text-gray-500 mb-3">刪除企業將同時刪除所有相關課程及資料，此操作無法復原。</p>
        <DeleteCompanyButton companyId={id} companyName={company.name} />
      </div>
    </div>
  )
}
