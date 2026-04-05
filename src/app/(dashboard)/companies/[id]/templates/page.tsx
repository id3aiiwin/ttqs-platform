import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader } from '@/components/ui/card'
import { CompanyTemplateEditor } from '@/components/company/company-template-editor'
import { InitTemplatesButton } from '@/components/company/init-templates-button'

export const metadata = { title: '表單模板設定 | ID3A 管理平台' }

export default async function TemplatesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const serviceClient = createServiceClient()

  const { data: company } = await serviceClient
    .from('companies')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!company) notFound()

  const { data: templates } = await serviceClient
    .from('company_form_templates')
    .select('*')
    .eq('company_id', id)
    .order('pddro_phase')
    .order('sort_order')

  const hasTemplates = templates && templates.length > 0
  const pendingCount = templates?.filter((t) => t.needs_customization && !t.is_confirmed).length ?? 0

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${id}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回企業詳情
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">PDDRO 表單模板</h1>
        <p className="text-gray-500 text-sm mt-1">{company.name}</p>
      </div>

      {/* 待確認提示 */}
      {hasTemplates && pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 mb-4 flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div>
            <p className="font-medium">有 {pendingCount} 個項目需要確認</p>
            <p className="text-xs text-amber-600 mt-0.5">
              這些項目含有企業專屬資訊（如公司名稱、負責人等），請確認內容是否已依企業實際情況調整。
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 mb-6">
        此模板適用於「{company.name}」的所有課程。新增課程時會自動複製一份表單清單。
        已建立的課程不受模板變更影響。
      </div>

      {!hasTemplates ? (
        <Card>
          <div className="text-center py-16 px-4">
            <svg className="w-14 h-14 text-gray-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 mb-1">尚未設定表單模板</p>
            <p className="text-xs text-gray-400 mb-4">載入公版 PDDRO 預設表單後，可依企業需求自訂</p>
            <InitTemplatesButton companyId={id} />
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">表單項目</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {templates.length} 個項目，跨 5 個構面
                  {pendingCount > 0 && (
                    <span className="text-amber-600 ml-2">（{pendingCount} 個待確認）</span>
                  )}
                </p>
              </div>
            </div>
          </CardHeader>
          <CompanyTemplateEditor
            companyId={id}
            templates={templates}
          />
        </Card>
      )}
    </div>
  )
}
