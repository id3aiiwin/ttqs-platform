'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ImportEmployeesButton({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const router = useRouter()

  async function handleImport() {
    if (!csvText.trim()) return
    setImporting(true)
    setResult(null)
    try {
      const res = await fetch('/api/import-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, csvText }),
      })
      const data = await res.json()
      if (data.error) {
        alert('匯入失敗：' + data.error)
      } else {
        setResult(data)
        if (data.success > 0) router.refresh()
      }
    } catch {
      alert('匯入失敗')
    }
    setImporting(false)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
        批次匯入員工
      </button>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-sm">批次匯入員工</h3>
        <button onClick={() => { setOpen(false); setResult(null); setCsvText('') }}
          className="text-xs text-gray-400 hover:text-gray-600">關閉</button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
        <p className="font-medium mb-1">CSV 格式（每行一位員工）：</p>
        <code>姓名, email, 角色, 部門, 職稱, 到職日, 生日</code>
        <p className="mt-1 text-blue-600">角色：employee / manager / hr（後四欄選填）</p>
        <p className="text-blue-600">日期格式：2024-01-15</p>
      </div>

      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        rows={8}
        placeholder={`姓名, email, 角色, 部門, 職稱, 到職日, 生日\n王小明, ming@company.com, employee, 業務部, 業務專員, 2022-03-01, 1990-05-15\n李主管, manager@company.com, manager, 業務部, 業務經理, 2018-01-10, 1985-08-20`}
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      {/* 也支援檔案上傳 */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer">
          或上傳 CSV 檔案
          <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => setCsvText(reader.result as string)
            reader.readAsText(file)
          }} />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={handleImport} disabled={importing || !csvText.trim()}
          className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg px-4 py-2 disabled:opacity-50">
          {importing ? '匯入中...' : '開始匯入'}
        </button>
      </div>

      {result && (
        <div className={`rounded-lg px-3 py-2 text-sm ${result.failed > 0 ? 'bg-amber-50 text-amber-800' : 'bg-green-50 text-green-800'}`}>
          <p>成功 {result.success} 筆，失敗 {result.failed} 筆</p>
          {result.errors.length > 0 && (
            <ul className="mt-1 text-xs space-y-0.5">
              {result.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
