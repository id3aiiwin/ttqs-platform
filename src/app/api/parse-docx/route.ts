import { NextRequest, NextResponse } from 'next/server'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

interface FormField {
  id: string
  label: string
  type: string
  required?: boolean
  description?: string
  options?: { label: string; value: string }[]
  fields?: FormField[]
  min_rows?: number
  max_rows?: number
  signers?: string[]
}

interface FormSection {
  id: string
  title?: string
  fields: FormField[]
}

interface FormSchema {
  title: string
  subtitle?: string
  sections: FormSection[]
}

/**
 * POST /api/parse-docx
 * 上傳 .docx 檔案，自動解析為結構化 FormSchema
 * 同時將企業名稱替換為 {{公司名稱}}
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyNames = (formData.get('company_names') as string || '').split(',').map(s => s.trim()).filter(Boolean)

    if (!file) {
      return NextResponse.json({ error: '請上傳檔案' }, { status: 400 })
    }

    if (!file.name.endsWith('.docx')) {
      return NextResponse.json({ error: '僅支援 .docx 格式' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const zip = new PizZip(buffer)

    // 用 docxtemplater 提取全文
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{{', end: '}}' },
    })

    const fullText = doc.getFullText()

    // 替換企業名稱為占位符
    let processedText = fullText
    const detectedNames: string[] = []
    for (const name of companyNames) {
      if (name && processedText.includes(name)) {
        processedText = processedText.replaceAll(name, '{{公司名稱}}')
        detectedNames.push(name)
      }
    }

    // 解析文字結構
    const schema = parseTextToSchema(processedText, file.name)

    return NextResponse.json({
      schema,
      rawText: processedText,
      detectedNames,
      fileName: file.name,
    })
  } catch (error) {
    console.error('parse-docx error:', error)
    return NextResponse.json({ error: '解析失敗：' + (error as Error).message }, { status: 500 })
  }
}

/**
 * 將提取的文字智能解析為 FormSchema
 * 邏輯：
 * - 第一行作為標題
 * - 空行分隔區段
 * - 含 □ 或 ☐ 的行 → checkbox/radio
 * - 含 _____ 的行 → text 填寫欄位
 * - 含表格分隔符的行 → 表格結構
 * - 其他 → static_text 或 section header
 */
function parseTextToSchema(text: string, fileName: string): FormSchema {
  const lines = text.split('\n').map(l => l.trimEnd())

  // 提取標題（第一個非空行）
  let titleLine = ''
  let startIdx = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      titleLine = lines[i].trim()
      startIdx = i + 1
      break
    }
  }

  // 提取副標題（如果第二行看起來像表號）
  let subtitle: string | undefined
  if (startIdx < lines.length) {
    const nextLine = lines[startIdx]?.trim()
    if (nextLine && /^[0-9A-Z]{1,3}[A-Z]{2}-/.test(nextLine)) {
      subtitle = nextLine
      startIdx++
    }
  }

  // 按空行分段
  const paragraphs: string[][] = []
  let current: string[] = []
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) {
      if (current.length > 0) {
        paragraphs.push(current)
        current = []
      }
    } else {
      current.push(line)
    }
  }
  if (current.length > 0) paragraphs.push(current)

  // 每段轉為 section
  const sections: FormSection[] = []
  let fieldCounter = 0

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx]
    const sectionId = `section_${pIdx + 1}`
    const fields: FormField[] = []

    // 判斷第一行是否為區段標題（短且不含填寫符號）
    let sectionTitle: string | undefined
    let lineStart = 0
    if (para[0] && para[0].length < 30 && !para[0].includes('□') && !para[0].includes('_____') && !para[0].includes('：')) {
      sectionTitle = para[0].replace(/^【|】$/g, '').trim()
      lineStart = 1
    }

    for (let i = lineStart; i < para.length; i++) {
      const line = para[i].trim()
      if (!line) continue
      fieldCounter++
      const fieldId = `field_${fieldCounter}`

      // 含勾選框 → checkbox 或 radio
      if (line.includes('□') || line.includes('☐')) {
        const parts = line.split(/[□☐]/).map(s => s.trim()).filter(Boolean)
        const labelMatch = line.match(/^(.+?)[：:]/)
        const label = labelMatch ? labelMatch[1].trim() : parts[0] || line
        const optionTexts = labelMatch ? parts : parts.slice(1)

        fields.push({
          id: fieldId,
          label,
          type: optionTexts.length > 3 ? 'checkbox' : 'radio',
          options: optionTexts.map((t, j) => ({ label: t, value: `opt_${j + 1}` })),
        })
      }
      // 含填寫線 → text 欄位
      else if (line.includes('_____') || line.includes('___')) {
        const labelMatch = line.match(/^(.+?)[：:]/)
        const label = labelMatch ? labelMatch[1].trim() : line.replace(/_+/g, '').trim() || `欄位 ${fieldCounter}`

        fields.push({
          id: fieldId,
          label,
          type: 'text',
          required: true,
        })
      }
      // 含 ： 的行 → 標籤+值
      else if (line.includes('：') || line.includes(':')) {
        const [label, ...rest] = line.split(/[：:]/)
        const value = rest.join('：').trim()

        if (value) {
          fields.push({
            id: fieldId,
            label: label.trim(),
            type: 'text',
            description: `預設值：${value}`,
          })
        } else {
          fields.push({
            id: fieldId,
            label: label.trim(),
            type: 'text',
          })
        }
      }
      // 表格行（含 | 分隔）
      else if (line.includes(' | ') || line.includes('\t')) {
        // 如果是表格的第一行，嘗試建立 repeating_group
        fields.push({
          id: fieldId,
          label: line.substring(0, 20) + (line.length > 20 ? '...' : ''),
          type: 'static_text',
          description: line,
        })
      }
      // 簽核相關
      else if (line.includes('簽核') || line.includes('承辦人') || line.includes('主管') || line.includes('總經理')) {
        const signers: string[] = []
        if (line.includes('承辦人')) signers.push('承辦人')
        if (line.includes('主管')) signers.push('主管')
        if (line.includes('總經理')) signers.push('總經理')

        if (signers.length > 0) {
          fields.push({ id: fieldId, label: '簽核', type: 'signature', signers })
        } else {
          fields.push({ id: fieldId, label: line, type: 'static_text' })
        }
      }
      // 其他文字 → 靜態文字
      else {
        fields.push({
          id: fieldId,
          label: line,
          type: 'static_text',
        })
      }
    }

    if (fields.length > 0) {
      sections.push({ id: sectionId, title: sectionTitle, fields })
    }
  }

  // 如果完全沒解析到，至少放一個文字區塊
  if (sections.length === 0) {
    sections.push({
      id: 'main',
      title: '文件內容',
      fields: [{ id: 'content', label: '文件內容', type: 'textarea', description: '自動匯入的文字內容' }],
    })
  }

  return { title: titleLine || fileName.replace('.docx', ''), subtitle, sections }
}
