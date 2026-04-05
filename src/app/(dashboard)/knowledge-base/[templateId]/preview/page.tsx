import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import type { FormSchema } from '@/types/form-schema'

export const metadata = { title: '文件預覽 | ID3A 管理平台' }

const TIER_LABELS: Record<number, string> = { 1: '一階：管理手冊', 2: '二階：程序文件', 3: '三階：工作指導書', 4: '四階：表單' }

export default async function PreviewPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params
  const sc = createServiceClient()

  const { data: template } = await sc.from('knowledge_base_templates').select('*').eq('id', templateId).single()
  if (!template) notFound()

  const schema = template.structured_content as unknown as FormSchema | null

  // 預覽用的公司名稱
  const previewCompanyName = '○○○股份有限公司'
  const replaceCompanyName = (text: string) => text.replace(/\{\{公司名稱\}\}/g, previewCompanyName).replace(/\{\{企業代碼\}\}/g, 'XXX')

  return (
    <div className="min-h-screen bg-white">
      {/* 工具列 */}
      <div className="no-print sticky top-0 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <a href="/knowledge-base" className="text-sm text-gray-500 hover:text-gray-700">← 返回知識庫</a>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-700 font-medium">{template.name}</span>
          {template.tier && <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{TIER_LABELS[template.tier]}</span>}
        </div>
        <button onClick={() => {}} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          id="print-btn">
          列印 / PDF
        </button>
      </div>

      {/* 文件預覽 */}
      <div className="max-w-[210mm] mx-auto py-10 px-16" style={{ fontFamily: "'Microsoft JhengHei', 'PingFang TC', sans-serif" }}>
        {/* 標題 */}
        <div className="text-center mb-8 border-b-2 border-gray-800 pb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {replaceCompanyName(schema?.title ?? template.name)}
          </h1>
          {template.doc_number_format && (
            <p className="text-sm text-gray-500 mt-1">文件編號：{replaceCompanyName(template.doc_number_format)}</p>
          )}
          {template.version && <p className="text-sm text-gray-500">版本：{template.version}</p>}
        </div>

        {/* 純文字內容 */}
        {template.content && (
          <div className="mb-8">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-loose">
              {replaceCompanyName(template.content)}
            </pre>
          </div>
        )}

        {/* 結構化表單預覽 */}
        {schema && schema.sections && (
          <div className="space-y-6">
            {schema.sections.map((section) => (
              <div key={section.id}>
                {section.title && (
                  <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 mb-3">
                    {section.title}
                  </h2>
                )}
                {section.description && (
                  <p className="text-xs text-gray-500 mb-2">{section.description}</p>
                )}

                <div className="space-y-2">
                  {(section.fields ?? []).map((field) => {
                    if (field.type === 'static_text') {
                      return <p key={field.id} className="text-sm text-gray-600 italic">{field.label}</p>
                    }
                    if (field.type === 'section_header') {
                      return <h3 key={field.id} className="text-sm font-semibold text-gray-800 mt-2">{field.label}</h3>
                    }
                    if (field.type === 'signature') {
                      return (
                        <div key={field.id} className="flex gap-8 mt-4 pt-4 border-t border-gray-200">
                          {(field.signers ?? []).map(signer => (
                            <div key={signer} className="text-center">
                              <div className="w-24 h-12 border-b border-gray-400 mb-1" />
                              <p className="text-xs text-gray-500">{signer}</p>
                              <p className="text-xs text-gray-400">日期：____/____/____</p>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    if (field.type === 'repeating_group') {
                      return (
                        <div key={field.id} className="mt-2 mb-2">
                          <p className="text-xs font-medium text-gray-600 mb-1">{field.label}</p>
                          <table className="w-full text-xs border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-gray-100">
                                {(field.fields ?? []).map(f => (
                                  <th key={f.id} className="border border-gray-300 px-2 py-1 text-left font-medium">{f.label}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {[1, 2, 3].map(row => (
                                <tr key={row}>
                                  {(field.fields ?? []).map(f => (
                                    <td key={f.id} className="border border-gray-300 px-2 py-2">&nbsp;</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    }
                    if (field.type === 'file_upload') {
                      return (
                        <div key={field.id} className="flex items-center gap-2 py-1">
                          <span className="text-sm text-gray-700">{field.label}：</span>
                          <span className="text-xs text-gray-400 border border-dashed border-gray-300 rounded px-3 py-1">（附件）</span>
                        </div>
                      )
                    }
                    if (field.type === 'radio' || field.type === 'checkbox') {
                      return (
                        <div key={field.id} className="py-1">
                          <span className="text-sm text-gray-700">{field.label}：</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {(field.options ?? []).map(o => `□ ${o.label}`).join('　')}
                          </span>
                        </div>
                      )
                    }
                    if (field.type === 'textarea') {
                      return (
                        <div key={field.id} className="py-1">
                          <p className="text-sm text-gray-700 mb-1">{field.label}：</p>
                          <div className="border border-gray-300 rounded min-h-[60px] p-2">
                            {field.description && <p className="text-xs text-gray-400 italic">{field.description}</p>}
                          </div>
                        </div>
                      )
                    }
                    // text, number, date, etc
                    return (
                      <div key={field.id} className="flex items-center gap-2 py-1">
                        <span className="text-sm text-gray-700">{field.label}：</span>
                        <span className="flex-1 border-b border-gray-300 min-w-[100px]">&nbsp;</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {!template.content && !schema && (
          <p className="text-center text-gray-400 py-20">此文件尚未建立內容</p>
        )}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('print-btn')?.addEventListener('click', () => window.print());
      `}} />

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
        }
      `}} />
    </div>
  )
}
