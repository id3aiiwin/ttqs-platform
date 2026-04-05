'use client'

import { useState, useCallback, useMemo } from 'react'

interface Company { id: string; name: string }
interface Course { id: string; title: string; company_id: string | null; start_date: string | null }

interface Props {
  companies: Company[]
  courses: Course[]
}

interface ParsedRow {
  [key: string]: string
}

interface ColumnMapping {
  csvColumn: string
  mappedTo: string
}

const KNOWN_FIELDS: Record<string, string[]> = {
  name: ['姓名', '學員姓名', '名字', 'name'],
  birthday: ['生日', '出生日期', 'birthday'],
  email: ['email', 'e-mail', '電子信箱', '信箱'],
  phone: ['電話', '手機', '聯絡電話', 'phone'],
  // Score fields
  le1: ['學習效果1', '課程內容有助於工作', 'le1'],
  le2: ['學習效果2', '學到新知識或技能', 'le2'],
  le3: ['學習效果3', '願意推薦此課程', 'le3'],
  ce1: ['課程評價1', '課程內容充實', 'ce1'],
  ce2: ['課程評價2', '教材適當', 'ce2'],
  ce3: ['課程評價3', '課程時間安排恰當', 'ce3'],
  ie1: ['講師評價1', '講師表達清楚', 'ie1'],
  ie2: ['講師評價2', '講師專業能力', 'ie2'],
  ie3: ['講師評價3', '講師互動良好', 'ie3'],
  ve1: ['場地評價1', '場地設備', 've1'],
  ve2: ['場地評價2', '環境整潔', 've2'],
  open_positive: ['正面回饋', '最滿意的地方', '優點', 'positive'],
  open_improve: ['改善建議', '最需改進的地方', '建議', 'improve'],
  future_courses: ['未來課程', '想上的課程', '期望課程', 'future'],
}

function autoMapColumn(csvHeader: string): string {
  const h = csvHeader.trim().toLowerCase()
  for (const [field, aliases] of Object.entries(KNOWN_FIELDS)) {
    if (aliases.some(a => h.includes(a.toLowerCase()))) return field
  }
  // Score pattern: any column with numbers or 低中高 values is likely a score
  return 'skip'
}

function detectFormat(values: string[]): string {
  for (const v of values) {
    const t = v.trim()
    if (['低', '中', '高'].includes(t)) return '低中高'
    if (['非常同意', '同意', '普通', '不同意', '非常不同意'].includes(t)) return '五級同意'
    if (['非常低', '低度', '中度', '高度', '非常高'].includes(t)) return '五級程度'
    const n = Number(t)
    if (n >= 1 && n <= 5) return '數字 1-5'
    if ([20, 40, 60, 80, 100].includes(n)) return '百分制'
  }
  return '未知'
}

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse (handles quoted fields with commas)
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
      current += ch
    }
    values.push(current.trim())

    const row: ParsedRow = {}
    headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })
    rows.push(row)
  }

  return { headers, rows }
}

const FIELD_OPTIONS = [
  { value: 'skip', label: '-- 略過 --' },
  { value: 'name', label: '姓名' },
  { value: 'birthday', label: '生日' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: '電話' },
  { value: 'le1', label: '學習效果 1' },
  { value: 'le2', label: '學習效果 2' },
  { value: 'le3', label: '學習效果 3' },
  { value: 'ce1', label: '課程評價 1' },
  { value: 'ce2', label: '課程評價 2' },
  { value: 'ce3', label: '課程評價 3' },
  { value: 'ie1', label: '講師評價 1' },
  { value: 'ie2', label: '講師評價 2' },
  { value: 'ie3', label: '講師評價 3' },
  { value: 've1', label: '場地評價 1' },
  { value: 've2', label: '場地評價 2' },
  { value: 'open_positive', label: '正面回饋' },
  { value: 'open_improve', label: '改善建議' },
  { value: 'future_courses', label: '未來課程' },
]

export function SurveyImportClient({ companies, courses }: Props) {
  const [step, setStep] = useState(1)

  // Step 1: Course selection
  const [companyId, setCompanyId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [createNew, setCreateNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState('')

  // Step 2: CSV
  const [csvText, setCsvText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [detectedFormat, setDetectedFormat] = useState('')

  // Step 3: Mapping
  const [mappings, setMappings] = useState<ColumnMapping[]>([])

  // Step 4: Import
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success: number; failed: number; studentsCreated: number; enrollmentsCreated: number; errors: string[]
  } | null>(null)

  const filteredCourses = useMemo(() => {
    if (!companyId) return courses
    return courses.filter(c => c.company_id === companyId)
  }, [companyId, courses])

  // Step 1 -> 2
  const handleStep1Next = () => {
    if (!createNew && !courseId) return
    if (createNew && !newTitle) return
    setStep(2)
  }

  // Step 2: parse CSV
  const handleCSVParse = useCallback(() => {
    const { headers: h, rows: r } = parseCSV(csvText)
    if (h.length === 0) return
    setHeaders(h)
    setRows(r)

    // Detect format from all values
    const allValues = r.flatMap(row => Object.values(row))
    setDetectedFormat(detectFormat(allValues))

    // Auto-map
    const autoMapped = h.map(col => ({
      csvColumn: col,
      mappedTo: autoMapColumn(col),
    }))
    setMappings(autoMapped)
    setStep(3)
  }, [csvText])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string ?? '')
    }
    reader.readAsText(file)
  }

  // Step 3 -> 4
  const handleStep3Next = () => {
    const hasName = mappings.some(m => m.mappedTo === 'name')
    if (!hasName) {
      alert('請至少對應「姓名」欄位')
      return
    }
    setStep(4)
  }

  // Step 4: Import
  const handleImport = async () => {
    setImporting(true)
    setResult(null)

    // Build mapped rows
    const mappedRows = rows.map(row => {
      const mapped: Record<string, string> = {}
      mappings.forEach(m => {
        if (m.mappedTo !== 'skip') {
          mapped[m.mappedTo] = row[m.csvColumn] ?? ''
        }
      })
      return mapped
    })

    try {
      const res = await fetch('/api/survey-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: createNew ? null : courseId,
          company_id: companyId || null,
          new_course_title: createNew ? newTitle : null,
          new_course_date: createNew ? newDate : null,
          rows: mappedRows,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ success: 0, failed: rows.length, studentsCreated: 0, enrollmentsCreated: 0, errors: [data.error ?? '匯入失敗'] })
      } else {
        setResult(data)
      }
    } catch (err) {
      setResult({ success: 0, failed: rows.length, studentsCreated: 0, enrollmentsCreated: 0, errors: ['網路錯誤'] })
    } finally {
      setImporting(false)
    }
  }

  const scoreFields = mappings.filter(m => m.mappedTo.match(/^(le|ce|ie|ve)\d$/))
  const previewStudentCount = rows.length
  const previewScoreCount = rows.length * scoreFields.length

  return (
    <div className="space-y-6">
      {/* Step indicators */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { n: 1, label: '選擇課程' },
          { n: 2, label: '上傳 CSV' },
          { n: 3, label: '欄位對應' },
          { n: 4, label: '預覽匯入' },
        ].map(s => (
          <div key={s.n} className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step >= s.n ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>{s.n}</span>
            <span className={step >= s.n ? 'text-gray-900 font-medium' : 'text-gray-400'}>{s.label}</span>
            {s.n < 4 && <span className="text-gray-300 mx-1">{'>'}</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Select Course */}
      {step === 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">步驟 1：選擇課程</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">企業</label>
            <select value={companyId} onChange={e => { setCompanyId(e.target.value); setCourseId('') }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
              <option value="">-- 全部 / 公開課 --</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input type="checkbox" checked={createNew} onChange={e => setCreateNew(e.target.checked)}
                className="rounded border-gray-300" />
              <span className="text-gray-700">新建課程</span>
            </label>

            {createNew ? (
              <div className="space-y-3 pl-6">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="課程名稱"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            ) : (
              <select value={courseId} onChange={e => setCourseId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">-- 選擇課程 --</option>
                {filteredCourses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title}{c.start_date ? ` (${c.start_date})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button onClick={handleStep1Next}
            disabled={!createNew && !courseId || createNew && !newTitle}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
            下一步
          </button>
        </div>
      )}

      {/* Step 2: Upload CSV */}
      {step === 2 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">步驟 2：上傳 CSV</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">選擇檔案</label>
            <input type="file" accept=".csv" onChange={handleFileUpload}
              className="text-sm text-gray-600" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">或直接貼上 CSV 內容</label>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
              rows={8} placeholder="姓名,生日,學習效果1,課程評價1,..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" />
          </div>

          {/* Preview first 5 rows if parsed */}
          {csvText && (() => {
            const { headers: h, rows: r } = parseCSV(csvText)
            if (h.length === 0) return null
            const previewRows = r.slice(0, 5)
            return (
              <div>
                <p className="text-xs text-gray-500 mb-2">預覽（前 {Math.min(5, r.length)} 筆，共 {r.length} 筆）</p>
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse w-full">
                    <thead>
                      <tr>
                        {h.map((col, i) => (
                          <th key={i} className="border border-gray-200 bg-gray-50 px-2 py-1 text-left whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, ri) => (
                        <tr key={ri}>
                          {h.map((col, ci) => (
                            <td key={ci} className="border border-gray-200 px-2 py-1 whitespace-nowrap">{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  偵測格式：<span className="font-medium text-gray-600">{detectFormat(r.flatMap(row => Object.values(row)))}</span>
                </p>
              </div>
            )
          })()}

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              上一步
            </button>
            <button onClick={handleCSVParse} disabled={!csvText.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              解析並繼續
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Column Mapping */}
      {step === 3 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">步驟 3：欄位對應</h2>
          {detectedFormat && (
            <p className="text-sm text-gray-500">偵測到的格式：<span className="font-medium text-indigo-600">{detectedFormat}</span></p>
          )}

          <div className="space-y-2">
            {mappings.map((m, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-40 truncate flex-shrink-0" title={m.csvColumn}>{m.csvColumn}</span>
                <span className="text-gray-400">→</span>
                <select
                  value={m.mappedTo}
                  onChange={e => {
                    const next = [...mappings]
                    next[idx] = { ...next[idx], mappedTo: e.target.value }
                    setMappings(next)
                  }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white"
                >
                  {FIELD_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              上一步
            </button>
            <button onClick={handleStep3Next}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview & Import */}
      {step === 4 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">步驟 4：預覽與匯入</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-indigo-700">{previewStudentCount}</p>
              <p className="text-sm text-indigo-600">筆學員資料</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{previewScoreCount}</p>
              <p className="text-sm text-green-600">筆滿意度回覆</p>
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>課程：{createNew ? `新建「${newTitle}」` : filteredCourses.find(c => c.id === courseId)?.title ?? '—'}</p>
            <p>企業：{companies.find(c => c.id === companyId)?.name ?? '無（公開課）'}</p>
            <p>欄位對應：{mappings.filter(m => m.mappedTo !== 'skip').length} 個欄位已對應</p>
            <p>偵測格式：{detectedFormat}</p>
          </div>

          {result && (
            <div className={`rounded-lg p-4 ${result.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="font-medium text-sm mb-2">{result.failed > 0 ? '匯入完成（有錯誤）' : '匯入成功'}</p>
              <div className="text-sm space-y-1">
                <p>成功：{result.success} 筆</p>
                <p>失敗：{result.failed} 筆</p>
                <p>新建學員：{result.studentsCreated} 位</p>
                <p>新建選課紀錄：{result.enrollmentsCreated} 筆</p>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-red-600 mb-1">錯誤訊息：</p>
                  <ul className="text-xs text-red-500 list-disc list-inside">
                    {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                    {result.errors.length > 10 && <li>...還有 {result.errors.length - 10} 個錯誤</li>}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(3)} disabled={importing}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
              上一步
            </button>
            <button onClick={handleImport} disabled={importing}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
              {importing ? '匯入中...' : '開始匯入'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
