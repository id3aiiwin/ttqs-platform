import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { KbEditorClient } from './kb-editor-client'
import type { FormSchema } from '@/types/form-schema'

export const metadata = { title: '編輯文件內容 | ID3A 管理平台' }

export default async function KbEditorPage({
  params,
}: {
  params: Promise<{ templateId: string }>
}) {
  const { templateId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (profile?.role !== 'consultant') redirect('/dashboard')

  const serviceClient = createServiceClient()

  const { data: template } = await serviceClient
    .from('knowledge_base_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (!template) notFound()

  // 取得結構化內容，如果沒有則從純文字內容產生初始結構
  let schema: FormSchema
  if (template.structured_content) {
    schema = template.structured_content as unknown as FormSchema
  } else {
    // 從純文字內容建立初始結構
    schema = {
      title: `{{公司名稱}} ${template.name}`,
      subtitle: template.doc_number_format ?? undefined,
      sections: [{
        id: 'main',
        title: '文件內容',
        fields: template.content
          ? [{
              id: 'content_text',
              label: '文件內容',
              type: 'textarea' as const,
              description: '從純文字內容轉入，可重新編排為結構化欄位',
              default_value: template.content,
            }]
          : [],
      }],
    }
  }

  const TIER_LABELS: Record<number, string> = { 1: '一階', 2: '二階', 3: '三階', 4: '四階' }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/knowledge-base" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回知識庫
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-3">編輯文件內容</h1>
        <div className="flex items-center gap-2 mt-1">
          {template.tier && (
            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {TIER_LABELS[template.tier]}
            </span>
          )}
          <p className="text-gray-500 text-sm">{template.name}</p>
          {template.doc_number_format && (
            <span className="text-xs font-mono text-gray-400">{template.doc_number_format}</span>
          )}
        </div>
      </div>

      {template.content && !template.structured_content && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 mb-4">
          此文件有純文字內容，已自動轉入編輯器。你可以重新編排為結構化欄位（新增區段、拆分欄位等）。
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <KbEditorClient
          templateId={templateId}
          schema={schema}
        />
      </div>
    </div>
  )
}
