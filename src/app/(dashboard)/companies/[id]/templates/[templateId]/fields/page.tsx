import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { PDDRO_FORM_SCHEMAS } from '@/lib/pddro-form-schemas'
import { FieldEditorClient } from './field-editor-client'
import type { FormSchema } from '@/types/form-schema'
import { getUser } from '@/lib/get-user'

export const metadata = { title: '編輯表單欄位 | ID3A 管理平台' }

export default async function FieldEditorPage({
  params,
}: {
  params: Promise<{ id: string; templateId: string }>
}) {
  const { id: companyId, templateId } = await params
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const serviceClient = createServiceClient()

  const { data: company } = await serviceClient
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .single()

  if (!company) notFound()

  const { data: template } = await serviceClient
    .from('company_form_templates')
    .select('*')
    .eq('id', templateId)
    .eq('company_id', companyId)
    .single()

  if (!template) notFound()

  // 取得 field_schema：企業自訂 > 系統預設 > 空白
  let schema: FormSchema | null = template.field_schema as unknown as FormSchema | null
  const hasCustomSchema = !!schema
  if (!schema && template.standard_name) {
    schema = PDDRO_FORM_SCHEMAS[template.standard_name] ?? null
  }
  if (!schema) {
    schema = {
      title: `{company_name} ${template.name}`,
      sections: [{ id: 'default', title: '基本資訊', fields: [] }],
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/companies/${companyId}/templates`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回模板列表
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">編輯表單欄位</h1>
        <p className="text-gray-500 text-sm mt-1">
          {company.name} / {template.name}
          {template.ttqs_indicator && (
            <span className="ml-2 text-xs font-mono text-gray-400">({template.ttqs_indicator})</span>
          )}
        </p>
      </div>

      {!hasCustomSchema && template.standard_name && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 mb-4">
          目前使用系統預設欄位。編輯後將儲存為企業自訂版本。
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <FieldEditorClient
          templateId={templateId}
          companyId={companyId}
          schema={schema}
          companyName={company.name}
          hasSystemDefault={!!template.standard_name && !!PDDRO_FORM_SCHEMAS[template.standard_name]}
        />
      </div>
    </div>
  )
}
