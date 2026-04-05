'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS } from '@/lib/utils'

const ALL_ROLES = ['consultant', 'admin', 'instructor', 'analyst', 'hr', 'manager', 'employee', 'student']

interface User {
  id: string; full_name: string | null; email: string; role: string; roles: string[]
  company_id: string | null; instructor_level: string | null; analyst_level: string | null
}

interface Company { id: string; name: string }
interface Props { users: User[]; companyMap: Record<string, string>; companies?: Company[] }

export function RoleManagementClient({ users, companyMap, companies }: Props) {
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRoles, setEditRoles] = useState<string[]>([])
  const [showImport, setShowImport] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const filtered = search
    ? users.filter(u => (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users

  function openEdit(user: User) {
    setEditingUser(user)
    setEditRoles([...(user.roles?.length > 0 ? user.roles : [user.role])])
  }

  function toggleRole(role: string) {
    if (editRoles.includes(role)) {
      setEditRoles(editRoles.filter(r => r !== role))
    } else {
      setEditRoles([...editRoles, role])
    }
  }

  function handleSave() {
    if (!editingUser || editRoles.length === 0) return
    startTransition(async () => {
      await fetch('/api/role-management', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: editingUser.id, roles: editRoles, primary_role: editRoles[0] }),
      })
      setEditingUser(null)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜尋姓名或 email..."
          className="flex-1 text-sm border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          批次匯入
        </button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">使用者</th>
                <th className="px-4 py-3 text-left">企業</th>
                <th className="px-4 py-3 text-left">角色</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{u.company_id ? (companyMap[u.company_id] ?? '—') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(u.roles?.length > 0 ? u.roles : [u.role]).map(r => (
                        <span key={r} className="text-[10px] bg-indigo-50 text-indigo-700 rounded px-1.5 py-0.5 font-medium">
                          {ROLE_LABELS[r] ?? r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => openEdit(u)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      編輯角色
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-8">沒有符合的使用者</p>}
        </div>
      </Card>

      {/* 批次匯入 Modal */}
      {showImport && (
        <BatchImportModal
          companies={companies ?? []}
          onClose={() => setShowImport(false)}
          onDone={() => { setShowImport(false); router.refresh() }}
        />
      )}

      {/* 角色編輯 Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditingUser(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-1">編輯角色</h3>
            <p className="text-sm text-gray-500 mb-4">{editingUser.full_name ?? editingUser.email}</p>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {ALL_ROLES.map(role => (
                <button key={role} onClick={() => toggleRole(role)}
                  className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition-all ${
                    editRoles.includes(role)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                  }`}>
                  {ROLE_LABELS[role] ?? role}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                已選 {editRoles.length} 個角色
                {editRoles.length === 0 && <span className="text-red-500 ml-1">至少選一個</span>}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">取消</button>
                <button onClick={handleSave} disabled={pending || editRoles.length === 0}
                  className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
                  {pending ? '儲存中...' : '儲存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ===== 批次匯入 Modal =====
function BatchImportModal({ companies, onClose, onDone }: {
  companies: { id: string; name: string }[]
  onClose: () => void
  onDone: () => void
}) {
  const [companyId, setCompanyId] = useState('')
  const [csvText, setCsvText] = useState('')
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      setCsvText(text ?? '')
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (!csvText.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/import-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: companyId || null, csvText }),
      })
      const data = await res.json()
      if (data.error) {
        setResult({ success: 0, failed: 1, errors: [data.error] })
      } else {
        setResult(data)
      }
    } catch (err) {
      setResult({ success: 0, failed: 1, errors: [(err as Error).message] })
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">批次匯入人員</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* 企業選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">歸屬企業（選填）</label>
            <select value={companyId} onChange={e => setCompanyId(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
              <option value="">無（個人學員/講師/分析師）</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">企業員工、HR、主管需選擇企業；個人學員、講師、分析師可不選</p>
          </div>

          {/* CSV 格式說明 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">CSV 格式</p>
            <p className="text-xs text-gray-500 mb-2">每行一筆，欄位用逗號分隔。第一行可以是標題行（會自動跳過）。</p>
            <div className="bg-white rounded border border-gray-200 p-2 text-xs text-gray-600 font-mono">
              姓名,email,角色,部門名稱,職稱,到職日,生日<br/>
              王小明,wang@example.com,employee,業務部,業務專員,2024-01-15,1990-05-20<br/>
              李小華,li@example.com,instructor,,,,,1985-03-10
            </div>
            <div className="mt-2 text-xs text-gray-400 space-y-0.5">
              <p>必填：姓名、email</p>
              <p>角色：employee, manager, hr, instructor, supervisor, analyst, student, consultant, admin</p>
              <p>日期格式：YYYY-MM-DD</p>
              <p>預設密碼：id3a</p>
            </div>
          </div>

          {/* 上傳或貼上 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">上傳 CSV 檔案</label>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">或直接貼上 CSV 內容</label>
            <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
              rows={6} placeholder="姓名,email,角色,部門名稱,職稱,到職日,生日"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          {/* 預覽筆數 */}
          {csvText.trim() && (
            <p className="text-xs text-gray-500">
              偵測到 {csvText.trim().split('\n').filter(l => l.trim()).length} 行資料
              {csvText.trim().split('\n')[0]?.includes('姓名') && '（含標題行）'}
            </p>
          )}

          {/* 結果 */}
          {result && (
            <div className={`rounded-lg p-4 ${result.failed > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
              <p className="text-sm font-medium mb-1">
                <span className="text-green-700">成功 {result.success} 筆</span>
                {result.failed > 0 && <span className="text-red-600 ml-3">失敗 {result.failed} 筆</span>}
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          {result && result.success > 0 ? (
            <button onClick={onDone}
              className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium">
              完成
            </button>
          ) : (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg">取消</button>
              <button onClick={handleImport} disabled={loading || !csvText.trim()}
                className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium disabled:opacity-50">
                {loading ? '匯入中...' : '開始匯入'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
