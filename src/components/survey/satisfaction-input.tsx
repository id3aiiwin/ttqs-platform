'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  courseId: string
  courseName: string
  isEnterprise: boolean
}

const SCORE_OPTIONS = [
  { label: '非常同意', value: 100 },
  { label: '同意', value: 80 },
  { label: '普通', value: 60 },
  { label: '不同意', value: 40 },
  { label: '非常不同意', value: 20 },
]

const LE_QUESTIONS = ['課程主題與內容切合度', '對研習內容瞭解吸收程度', '學習到新的知識或技能', '未來工作上實際應用程度']
const CE_QUESTIONS = ['學習目標說明清楚', '學習內容對工作有幫助', '學習內容條理分明', '例子、問答、個案研討有助學習', '課程難易安排適當', '課程符合產業發展趨勢']
const IE_QUESTIONS = ['講師準備充分', '講師具備足夠主題專業知識', '講師溝通技巧佳與學生互動良好', '內容介紹有組織、有架構', '鼓勵學員參與', '幫助學員克服學習障礙', '提供學員積極的回饋', '引導課程滿足我的學習需求', '教學方式能引發學習興趣', '教學進度掌握良好']

export function SatisfactionInput({ courseId, courseName, isEnterprise }: Props) {
  const [mode, setMode] = useState<'choose' | 'csv' | 'manual'>('choose')
  const [csvText, setCsvText] = useState('')
  const [manualMode, setManualMode] = useState<'simple' | 'detail'>('simple')
  const [simpleScores, setSimpleScores] = useState({ le: '', ce: '', ie: '' })
  const [detailScores, setDetailScores] = useState({
    le: Array(4).fill(0) as number[],
    ce: Array(6).fill(0) as number[],
    ie: Array(10).fill(0) as number[],
  })
  const [responseCount, setResponseCount] = useState('')
  const [result, setResult] = useState<{ imported?: number; stats?: Record<string, number> } | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // CSV 上傳
  function handleCsvUpload() {
    if (!csvText.trim()) return
    startTransition(async () => {
      const res = await fetch('/api/survey-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, csv_text: csvText }),
      })
      const data = await res.json()
      if (data.error) alert('上傳失敗：' + data.error)
      else { setResult(data); router.refresh() }
    })
  }

  // CSV 檔案讀取
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCsvText(reader.result as string)
    reader.readAsText(file)
  }

  // 手動回填
  function handleManualSubmit() {
    startTransition(async () => {
      let leAvg: number, ceAvg: number, ieAvg: number
      if (manualMode === 'simple') {
        leAvg = Number(simpleScores.le) || 0
        ceAvg = Number(simpleScores.ce) || 0
        ieAvg = Number(simpleScores.ie) || 0
      } else {
        leAvg = Math.round(detailScores.le.reduce((a, b) => a + b, 0) / 4 * 100) / 100
        ceAvg = Math.round(detailScores.ce.reduce((a, b) => a + b, 0) / 6 * 100) / 100
        ieAvg = Math.round(detailScores.ie.reduce((a, b) => a + b, 0) / 10 * 100) / 100
      }

      // 存到 survey stats
      await fetch('/api/survey-stats', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          manual_stats: {
            response_count: Number(responseCount) || 1,
            learning_effect_avg: leAvg,
            course_avg: ceAvg,
            instructor_avg: ieAvg,
            overall_avg: Math.round((leAvg + ceAvg + ieAvg) / 3 * 100) / 100,
          },
        }),
      })
      setResult({ stats: { learning_effect_avg: leAvg, course_avg: ceAvg, instructor_avg: ieAvg } })
      router.refresh()
    })
  }

  // 選擇模式
  if (mode === 'choose') {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">選擇滿意度回填方式：</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setMode('csv')}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 text-left transition-all">
            <span className="text-2xl block mb-2">📄</span>
            <p className="text-sm font-medium text-gray-900">CSV 上傳</p>
            <p className="text-xs text-gray-400 mt-0.5">上傳 SurveyCake 匯出的 CSV 檔案，系統自動計算</p>
          </button>
          <button onClick={() => setMode('manual')}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 text-left transition-all">
            <span className="text-2xl block mb-2">✏️</span>
            <p className="text-sm font-medium text-gray-900">手動回填</p>
            <p className="text-xs text-gray-400 mt-0.5">直接輸入平均分數或各題分數</p>
          </button>
        </div>
      </div>
    )
  }

  // 結果
  if (result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm font-medium text-green-700 mb-2">回填完成！</p>
        {result.imported && <p className="text-xs text-green-600">匯入 {result.imported} 筆回應</p>}
        {result.stats && (
          <div className="flex gap-4 mt-2 text-xs">
            <span>學習效果：{result.stats.learning_effect_avg}</span>
            <span>課程評價：{result.stats.course_avg}</span>
            <span>講師評價：{result.stats.instructor_avg}</span>
          </div>
        )}
        <button onClick={() => { setResult(null); setMode('choose') }} className="text-xs text-indigo-600 mt-2">重新回填</button>
      </div>
    )
  }

  // CSV 模式
  if (mode === 'csv') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">CSV 上傳</p>
          <button onClick={() => setMode('choose')} className="text-xs text-gray-400 hover:text-gray-600">← 返回</button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <p className="font-medium mb-1">SurveyCake 匯出方式：</p>
          <p>問卷結果 → 匯出 → 選擇 CSV 格式 → 上傳到這裡</p>
        </div>
        <label className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-400">
          <span className="text-sm text-gray-500">{csvText ? '已載入 CSV' : '選擇 CSV 檔案'}</span>
          <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
        </label>
        {csvText && (
          <>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <pre className="text-[10px] text-gray-500 whitespace-pre-wrap">{csvText.slice(0, 500)}...</pre>
            </div>
            <button onClick={handleCsvUpload} disabled={pending}
              className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {pending ? '匯入中...' : '開始匯入'}
            </button>
          </>
        )}
      </div>
    )
  }

  // 手動模式
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">手動回填</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setManualMode('simple')} className={`text-xs px-2 py-1 rounded ${manualMode === 'simple' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>簡易</button>
          <button onClick={() => setManualMode('detail')} className={`text-xs px-2 py-1 rounded ${manualMode === 'detail' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}>詳細</button>
          <button onClick={() => setMode('choose')} className="text-xs text-gray-400 hover:text-gray-600">← 返回</button>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500">填答人數</label>
        <input type="number" value={responseCount} onChange={e => setResponseCount(e.target.value)} placeholder="例：15"
          className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 mt-0.5" />
      </div>

      {manualMode === 'simple' ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">直接輸入各面向的平均分數（0-100）</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500">學習效果</label>
              <input type="number" value={simpleScores.le} onChange={e => setSimpleScores({ ...simpleScores, le: e.target.value })}
                placeholder="0-100" min={0} max={100} className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500">課程評價</label>
              <input type="number" value={simpleScores.ce} onChange={e => setSimpleScores({ ...simpleScores, ce: e.target.value })}
                placeholder="0-100" min={0} max={100} className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="text-xs text-gray-500">講師評價</label>
              <input type="number" value={simpleScores.ie} onChange={e => setSimpleScores({ ...simpleScores, ie: e.target.value })}
                placeholder="0-100" min={0} max={100} className="w-full text-sm border border-gray-300 rounded px-2 py-1.5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 max-h-80 overflow-y-auto">
          <ScoreSection title="學習效果" questions={LE_QUESTIONS} scores={detailScores.le}
            onChange={s => setDetailScores({ ...detailScores, le: s })} />
          <ScoreSection title="課程評價" questions={CE_QUESTIONS} scores={detailScores.ce}
            onChange={s => setDetailScores({ ...detailScores, ce: s })} />
          <ScoreSection title="講師評價" questions={IE_QUESTIONS} scores={detailScores.ie}
            onChange={s => setDetailScores({ ...detailScores, ie: s })} />
        </div>
      )}

      <button onClick={handleManualSubmit} disabled={pending}
        className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
        {pending ? '儲存中...' : '儲存滿意度'}
      </button>
    </div>
  )
}

function ScoreSection({ title, questions, scores, onChange }: {
  title: string; questions: string[]; scores: number[]; onChange: (s: number[]) => void
}) {
  const avg = scores.filter(s => s > 0).length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.filter(s => s > 0).length)
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-gray-700">{title}</p>
        {avg > 0 && <span className="text-xs text-indigo-600 font-bold">平均 {avg}</span>}
      </div>
      <div className="space-y-1">
        {questions.map((q, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 flex-1 truncate" title={q}>{q}</span>
            <select value={scores[i] || ''} onChange={e => {
              const s = [...scores]; s[i] = Number(e.target.value); onChange(s)
            }} className="text-xs border border-gray-300 rounded px-1.5 py-1 w-28 bg-white">
              <option value="">選擇</option>
              {SCORE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label} ({o.value})</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
