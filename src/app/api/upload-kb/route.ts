import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * 知識庫專用上傳：上傳 docx 時自動將「桃源保全股份有限公司」替換為 {{公司名稱}}
 * 並偵測文件中還有哪些可能是企業名稱的文字
 */

const KNOWN_COMPANY_NAMES = ['桃源保全股份有限公司']

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const templateId = formData.get('template_id') as string

  if (!file) return NextResponse.json({ error: '未選擇檔案' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase()
  const fileName = `knowledge-base/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const sc = createServiceClient()

  // docx 檔案：替換企業名稱為佔位符後再上傳
  if (ext === 'docx') {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const PizZip = (await import('pizzip')).default
      const zip = new PizZip(buffer)

      const detectedNames: string[] = []

      const xmlFiles = Object.keys(zip.files).filter((name) =>
        name.endsWith('.xml')
      )

      for (const xmlName of xmlFiles) {
        let content = zip.file(xmlName)?.asText()
        if (!content) continue

        let changed = false
        for (const companyName of KNOWN_COMPANY_NAMES) {
          if (content.includes(companyName)) {
            content = content.split(companyName).join('{{公司名稱}}')
            changed = true
            if (!detectedNames.includes(companyName)) detectedNames.push(companyName)
          }
        }

        if (changed) zip.file(xmlName, content)
      }

      const cleanedBuffer = zip.generate({ type: 'nodebuffer' })

      // 上傳清理後的檔案
      const { data, error } = await sc.storage.from('documents')
        .upload(fileName, cleanedBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: false,
        })

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // 更新範本 file_url
      if (templateId) {
        await sc.from('knowledge_base_templates').update({ file_url: data.path }).eq('id', templateId)
      }

      return NextResponse.json({
        path: data.path,
        fileName: file.name,
        detectedNames,
        cleaned: detectedNames.length > 0,
      })
    } catch (err) {
      console.error('[upload-kb] docx processing error:', err)
      // fallback: 直接上傳原檔
    }
  }

  // 非 docx 或 fallback：直接上傳
  const { data, error } = await sc.storage.from('documents')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (templateId) {
    await sc.from('knowledge_base_templates').update({ file_url: data.path }).eq('id', templateId)
  }

  return NextResponse.json({ path: data.path, fileName: file.name, cleaned: false })
}
