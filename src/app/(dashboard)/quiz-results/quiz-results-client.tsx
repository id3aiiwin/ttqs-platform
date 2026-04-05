'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseLineChatLog, type ParsedQuizSession } from '@/lib/line-quiz-parser'

interface Quiz { id: string; title: string; pass_score: number; total_points: number }
interface Profile { id: string; full_name: string | null; email: string | null }
interface Attempt {
  id: string; quiz_id: string; user_id: string
  score: number; total: number; percentage: number; passed: boolean
  completed_at: string; user_name: string; user_email: string; quiz_title: string
}

interface Props {
  quizzes: Quiz[]
  profiles: Profile[]
  attempts: Attempt[]
}

type Tab = 'records' | 'manual' | 'csv'

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of lines[i]) {
      if (ch === '"') { inQuotes = !inQuotes; continue }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue }
      current += ch
    }
    values.push(current.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })
    rows.push(row)
  }
  return { headers, rows }
}

export function QuizResultsClient({ quizzes, profiles, attempts }: Props) {
  const [tab, setTab] = useState<Tab>('records')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'records', label: '紀錄查詢' },
    { key: 'manual', label: '手動輸入' },
    { key: 'csv', label: 'CSV 匯入' },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'records' && <RecordsTab attempts={attempts} quizzes={quizzes} />}
      {tab === 'manual' && <ManualTab quizzes={quizzes} profiles={profiles} />}
      {tab === 'csv' && <CsvTab />}
    </div>
  )
}

/* ==================== Records Tab ==================== */
function RecordsTab({ attempts, quizzes }: { attempts: Attempt[]; quizzes: Quiz[] }) {
  const [quizFilter, setQuizFilter] = useState('')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return attempts.filter(a => {
      if (quizFilter && a.quiz_id !== quizFilter) return false
      if (search) {
        const s = search.toLowerCase()
        if (!a.user_name.toLowerCase().includes(s) && !a.user_email.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [attempts, quizFilter, search])

  const stats = useMemo(() => {
    if (filtered.length === 0) return { total: 0, passRate: 0, avgScore: 0 }
    const passed = filtered.filter(a => a.passed).length
    const avg = filtered.reduce((s, a) => s + a.percentage, 0) / filtered.length
    return { total: filtered.length, passRate: Math.round((passed / filtered.length) * 100), avgScore: Math.round(avg) }
  }, [filtered])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={quizFilter}
          onChange={e => setQuizFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">全部測驗</option>
          {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
        </select>
        <Input
          placeholder="搜尋學員姓名..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-60"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 mb-1">總筆數</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 mb-1">通過率</p>
            <p className="text-2xl font-bold text-gray-900">{stats.passRate}%</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-gray-500 mb-1">平均分數</p>
            <p className="text-2xl font-bold text-gray-900">{stats.avgScore}%</p>
          </CardBody>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 font-medium text-gray-500">學員</th>
                <th className="px-4 py-3 font-medium text-gray-500">測驗</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">分數</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-right">百分比</th>
                <th className="px-4 py-3 font-medium text-gray-500 text-center">通過</th>
                <th className="px-4 py-3 font-medium text-gray-500">完成時間</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">暫無紀錄</td></tr>
              ) : (
                filtered.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{a.user_name}</p>
                      <p className="text-xs text-gray-400">{a.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{a.quiz_title}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={
                        a.percentage >= 80 ? 'text-green-600' :
                        a.percentage >= 60 ? 'text-amber-600' : 'text-red-600'
                      }>
                        {a.score}/{a.total}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      <span className={
                        a.percentage >= 80 ? 'text-green-600' :
                        a.percentage >= 60 ? 'text-amber-600' : 'text-red-600'
                      }>
                        {a.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={a.passed ? 'success' : 'danger'}>
                        {a.passed ? '通過' : '未通過'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {new Date(a.completed_at).toLocaleString('zh-TW', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

/* ==================== Manual Tab ==================== */
function ManualTab({ quizzes, profiles }: { quizzes: Quiz[]; profiles: Profile[] }) {
  const [quizId, setQuizId] = useState('')
  const [userId, setUserId] = useState('')
  const [profileSearch, setProfileSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [score, setScore] = useState('')
  const [total, setTotal] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const selectedQuiz = quizzes.find(q => q.id === quizId)

  // Update total when quiz changes
  const handleQuizChange = (id: string) => {
    setQuizId(id)
    const q = quizzes.find(q => q.id === id)
    if (q) setTotal(String(q.total_points || 100))
  }

  const filteredProfiles = useMemo(() => {
    if (!profileSearch) return profiles.slice(0, 20)
    const s = profileSearch.toLowerCase()
    return profiles.filter(p =>
      (p.full_name?.toLowerCase().includes(s)) ||
      (p.email?.toLowerCase().includes(s))
    ).slice(0, 20)
  }, [profiles, profileSearch])

  const selectedProfile = profiles.find(p => p.id === userId)

  function handleSubmit() {
    if (!quizId || !userId || !score || !total) {
      setMsg({ type: 'error', text: '請填寫所有必填欄位' })
      return
    }
    const s = Number(score)
    const t = Number(total)
    const pct = t > 0 ? Math.round((s / t) * 100) : 0
    const passed = pct >= (selectedQuiz?.pass_score ?? 60)

    startTransition(async () => {
      const res = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'manual',
          quiz_id: quizId,
          user_id: userId,
          score: s,
          total: t,
          passed,
          completed_at: date ? new Date(date).toISOString() : undefined,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setMsg({ type: 'success', text: '紀錄新增成功！' })
        setScore('')
        router.refresh()
      } else {
        setMsg({ type: 'error', text: data.error || '新增失敗' })
      }
    })
  }

  function resetForm() {
    setQuizId('')
    setUserId('')
    setProfileSearch('')
    setScore('')
    setTotal('')
    setDate(new Date().toISOString().slice(0, 10))
    setMsg(null)
  }

  return (
    <Card>
      <CardBody>
        <div className="max-w-lg space-y-4">
          {/* Quiz dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">測驗 *</label>
            <select
              value={quizId}
              onChange={e => handleQuizChange(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">選擇測驗...</option>
              {quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
            </select>
          </div>

          {/* User searchable dropdown */}
          <div className="flex flex-col gap-1 relative">
            <label className="text-sm font-medium text-gray-700">學員 *</label>
            {selectedProfile ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm">
                <span className="text-gray-900">{selectedProfile.full_name || selectedProfile.email}</span>
                <span className="text-gray-400 text-xs">{selectedProfile.email}</span>
                <button
                  onClick={() => { setUserId(''); setProfileSearch('') }}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={profileSearch}
                  onChange={e => { setProfileSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="搜尋學員姓名或 Email..."
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {showDropdown && filteredProfiles.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredProfiles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setUserId(p.id); setProfileSearch(''); setShowDropdown(false) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2"
                      >
                        <span className="text-gray-900">{p.full_name || '(no name)'}</span>
                        <span className="text-gray-400 text-xs">{p.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Score and Total */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="分數 *"
              type="number"
              min={0}
              value={score}
              onChange={e => setScore(e.target.value)}
              placeholder="85"
            />
            <Input
              label="總分 *"
              type="number"
              min={1}
              value={total}
              onChange={e => setTotal(e.target.value)}
              placeholder="100"
            />
          </div>

          {/* Date */}
          <Input
            label="完成日期"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />

          {/* Preview */}
          {score && total && Number(total) > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <span className="text-gray-500">百分比: </span>
              <span className="font-medium">{Math.round((Number(score) / Number(total)) * 100)}%</span>
              {selectedQuiz && (
                <>
                  <span className="text-gray-300 mx-2">|</span>
                  <span className="text-gray-500">及格線: </span>
                  <span className="font-medium">{selectedQuiz.pass_score}%</span>
                  <span className="text-gray-300 mx-2">|</span>
                  {Math.round((Number(score) / Number(total)) * 100) >= selectedQuiz.pass_score
                    ? <Badge variant="success">通過</Badge>
                    : <Badge variant="danger">未通過</Badge>
                  }
                </>
              )}
            </div>
          )}

          {/* Message */}
          {msg && (
            <div className={`rounded-lg p-3 text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {msg.text}
              {msg.type === 'success' && (
                <button onClick={resetForm} className="ml-3 underline hover:no-underline">
                  繼續新增
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleSubmit} loading={pending}>新增紀錄</Button>
            <Button variant="secondary" onClick={resetForm}>清空</Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

/* ==================== CSV Tab ==================== */
type CsvMode = 'standard' | 'line_chat'

function CsvTab() {
  const [mode, setMode] = useState<CsvMode>('standard')
  const [csvText, setCsvText] = useState('')
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null)
  const [lineSessions, setLineSessions] = useState<ParsedQuizSession[]>([])
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [pending, startTransition] = useTransition()
  const [expandedSession, setExpandedSession] = useState<number | null>(null)
  const router = useRouter()

  function resetState() {
    setCsvText('')
    setPreview(null)
    setLineSessions([])
    setResult(null)
    setExpandedSession(null)
  }

  function handleModeChange(newMode: CsvMode) {
    setMode(newMode)
    resetState()
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setCsvText(text)
      setResult(null)
      if (mode === 'standard') {
        setPreview(parseCSV(text))
      } else {
        const sessions = parseLineChatLog(text)
        setLineSessions(sessions)
      }
    }
    reader.readAsText(file)
  }

  function handlePaste(text: string) {
    setCsvText(text)
    setResult(null)
    if (text.trim()) {
      if (mode === 'standard') {
        setPreview(parseCSV(text))
      } else {
        const sessions = parseLineChatLog(text)
        setLineSessions(sessions)
      }
    } else {
      setPreview(null)
      setLineSessions([])
    }
  }

  function handleImport() {
    if (!preview?.rows.length) return

    const rows = preview.rows.map(r => ({
      name: r['姓名'] || r['name'] || '',
      email: r['email'] || r['Email'] || r['EMAIL'] || '',
      quiz_title: r['測驗名稱'] || r['quiz_title'] || r['測驗'] || '',
      score: Number(r['得分'] || r['score'] || r['分數'] || 0),
      total: Number(r['總分'] || r['total'] || 100),
      date: r['日期'] || r['date'] || '',
    }))

    startTransition(async () => {
      const res = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk_import', rows }),
      })
      const data = await res.json()
      setResult({ success: data.success || 0, failed: data.failed || 0, errors: data.errors || [] })
      router.refresh()
    })
  }

  function handleLineImport() {
    if (!lineSessions.length) return

    startTransition(async () => {
      const res = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'line_chat_import', sessions: lineSessions }),
      })
      const data = await res.json()
      setResult({ success: data.success || 0, failed: data.failed || 0, errors: data.errors || [] })
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => handleModeChange('standard')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'standard'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          標準 CSV
        </button>
        <button
          onClick={() => handleModeChange('line_chat')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === 'line_chat'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          LINE 聊天紀錄
        </button>
      </div>

      {/* Format description */}
      <Card>
        <CardBody>
          {mode === 'standard' ? (
            <>
              <p className="text-sm font-medium text-gray-700 mb-2">CSV 格式說明</p>
              <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-x-auto">
{`姓名,email,測驗名稱,得分,總分,日期
王小明,wang@test.com,安全衛生測驗,85,100,2025-03-15
李小華,lee@test.com,安全衛生測驗,72,100,2025-03-15`}
              </pre>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700 mb-2">LINE 聊天紀錄匯入</p>
              <p className="text-sm text-gray-500 mb-2">
                上傳從 LINE Bot 匯出的聊天紀錄 CSV 檔案。系統會自動解析測驗問答與結果。
              </p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
                <p>支援格式：LINE 官方帳號聊天紀錄匯出（CSV）</p>
                <p>自動偵測：測驗開始、問答過程、測驗結果</p>
                <p>支援一個檔案中包含多個測驗記錄</p>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* Upload / Paste */}
      <Card>
        <CardBody>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">上傳 CSV 檔案</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                key={mode} // reset file input when mode changes
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            <div className="text-center text-xs text-gray-400">或</div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">貼上 CSV 內容</label>
              <textarea
                value={csvText}
                onChange={e => handlePaste(e.target.value)}
                rows={6}
                placeholder={mode === 'standard'
                  ? '姓名,email,測驗名稱,得分,總分,日期\n王小明,wang@test.com,安全衛生測驗,85,100,2025-03-15'
                  : '貼上 LINE 聊天紀錄 CSV 內容...'
                }
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Standard CSV Preview */}
      {mode === 'standard' && preview && preview.rows.length > 0 && (
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-700 mb-2">
              預覽（共 {preview.rows.length} 筆，顯示前 5 筆）
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    {preview.headers.map(h => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {preview.headers.map(h => (
                        <td key={h} className="px-3 py-2 text-gray-700">{row[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Button onClick={handleImport} loading={pending}>
                匯入 {preview.rows.length} 筆紀錄
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* LINE Chat Sessions Preview */}
      {mode === 'line_chat' && lineSessions.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            解析到 {lineSessions.length} 筆測驗紀錄
          </p>
          {lineSessions.map((session, idx) => (
            <Card key={idx}>
              <CardBody>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {session.companyName && (
                          <span className="text-xs text-gray-400">{session.companyName}</span>
                        )}
                        <p className="text-sm font-medium text-gray-900">{session.personName}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <Badge variant="default">{session.quizName}</Badge>
                        {session.result && (
                          <span className="font-medium text-indigo-600">{session.result}</span>
                        )}
                        <span>{session.endDate}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedSession(expandedSession === idx ? null : idx)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                  >
                    {expandedSession === idx ? '收合' : '查看作答'}
                  </button>
                </div>

                {expandedSession === idx && session.answers.length > 0 && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-2 py-1.5 text-left font-medium text-gray-500 w-12">題號</th>
                          <th className="px-2 py-1.5 text-left font-medium text-gray-500 w-12">作答</th>
                          <th className="px-2 py-1.5 text-left font-medium text-gray-500">題目預覽</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.answers.map((a, aIdx) => (
                          <tr key={aIdx} className="border-b border-gray-100">
                            <td className="px-2 py-1.5 text-gray-600">{a.questionNumber}</td>
                            <td className="px-2 py-1.5 font-mono font-medium text-gray-900">{a.answer}</td>
                            <td className="px-2 py-1.5 text-gray-500 truncate max-w-xs">{a.questionPreview}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
          <Button onClick={handleLineImport} loading={pending}>
            匯入 {lineSessions.length} 筆測驗紀錄
          </Button>
        </div>
      )}

      {/* No sessions found message for LINE mode */}
      {mode === 'line_chat' && csvText.trim() && lineSessions.length === 0 && (
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500 text-center py-4">
              未在聊天紀錄中偵測到測驗記錄。請確認檔案格式正確。
            </p>
          </CardBody>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardBody>
            <div className="space-y-2">
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="success">成功</Badge>
                  <span className="text-sm font-medium">{result.success} 筆</span>
                </div>
                {result.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="danger">失敗</Badge>
                    <span className="text-sm font-medium">{result.failed} 筆</span>
                  </div>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3 text-xs text-red-700 space-y-1">
                  {result.errors.map((err, i) => <p key={i}>{err}</p>)}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
