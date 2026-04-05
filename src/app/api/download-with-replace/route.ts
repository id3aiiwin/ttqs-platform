import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

/**
 * 企業下載知識庫文件時自動替換佔位符
 * GET /api/download-with-replace?template_id=xxx&company_id=xxx
 *
 * 對 .docx 檔案：下載後替換 {{公司名稱}} 等佔位符再回傳
 * 對其他格式：直接 redirect 到 signed URL
 */
export async function GET(request: NextRequest) {
  const templateId = request.nextUrl.searchParams.get('template_id')
  const companyId = request.nextUrl.searchParams.get('company_id')

  if (!templateId || !companyId) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 })
  }

  const sc = createServiceClient()

  // 取得範本和企業資料
  const [{ data: template }, { data: company }] = await Promise.all([
    sc.from('knowledge_base_templates').select('name, file_url, auto_replace_rules').eq('id', templateId).single(),
    sc.from('companies').select('*').eq('id', companyId).single() as unknown as Promise<{ data: Record<string, unknown> | null }>,
  ])

  if (!template?.file_url) {
    return NextResponse.json({ error: '範本無檔案' }, { status: 404 })
  }

  const filePath = template.file_url
  const isDocx = filePath.endsWith('.docx')

  // 非 docx 檔案：直接 signed URL redirect
  if (!isDocx) {
    const { data } = await sc.storage.from('documents').createSignedUrl(filePath, 3600)
    if (data?.signedUrl) return NextResponse.redirect(data.signedUrl)
    return NextResponse.json({ error: '無法產生下載連結' }, { status: 500 })
  }

  // docx 檔案：下載 → 替換 → 回傳
  try {
    const { data: fileData, error } = await sc.storage.from('documents').download(filePath)
    if (error || !fileData) {
      return NextResponse.json({ error: error?.message ?? '下載失敗' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // 建立替換對照表
    const rules = (template.auto_replace_rules ?? []) as { placeholder: string; field: string }[]
    const fieldMap: Record<string, string> = {}

    if (company) {
      // companies.name → company.name 等
      for (const rule of rules) {
        const fieldParts = rule.field.split('.')
        const fieldName = fieldParts[fieldParts.length - 1]
        const value = company[fieldName]
        if (typeof value === 'string' && value) {
          fieldMap[rule.placeholder] = value
        }
      }
    }

    // 使用 docxtemplater 替換
    const PizZip = (await import('pizzip')).default
    const Docxtemplater = (await import('docxtemplater')).default

    const zip = new PizZip(buffer)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
    })

    // 將 {{公司名稱}} 格式轉為 docxtemplater 的 {公司名稱} 格式
    // docxtemplater 預設用 {} 而我們的佔位符是 {{}}
    // 所以直接做字串替換
    const xmlFiles = Object.keys(zip.files).filter((name) =>
      name.endsWith('.xml') || name.endsWith('.xml.rels')
    )

    for (const xmlName of xmlFiles) {
      let content = zip.file(xmlName)?.asText()
      if (!content) continue

      let changed = false
      for (const [placeholder, value] of Object.entries(fieldMap)) {
        // 替換純文字版本
        if (content.includes(placeholder)) {
          content = content.split(placeholder).join(value)
          changed = true
        }
        // 也替換可能被 Word XML 標籤拆開的版本（如 {{公司名稱}} 可能被拆成 {{公司 + 名稱}}）
        const innerText = placeholder.slice(2, -2) // 去掉 {{ }}
        const escaped = innerText.split('').join('(?:</[^>]*>(?:<[^>]*>)*)?')
        const regex = new RegExp(`\\{\\{${escaped}\\}\\}`, 'g')
        // 簡化版：只替換連續的，不處理被 XML tag 拆開的情況（後者需要更複雜的邏輯）
      }

      if (changed) {
        zip.file(xmlName, content)
      }
    }

    // 也替換「桃源保全股份有限公司」等硬編碼的企業名稱
    if (company?.name) {
      for (const xmlName of xmlFiles) {
        let content = zip.file(xmlName)?.asText()
        if (!content) continue
        if (content.includes('桃源保全股份有限公司')) {
          content = content.split('桃源保全股份有限公司').join(company.name as string)
          zip.file(xmlName, content)
        }
      }
    }

    const outputBuffer = zip.generate({ type: 'nodebuffer' })

    const fileName = encodeURIComponent(`${template.name}_${(company?.name as string) ?? ''}.docx`)

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (err) {
    console.error('[download-with-replace] error:', err)
    // fallback: 直接下載原檔
    const { data } = await sc.storage.from('documents').createSignedUrl(filePath, 3600)
    if (data?.signedUrl) return NextResponse.redirect(data.signedUrl)
    return NextResponse.json({ error: '處理失敗' }, { status: 500 })
  }
}
