'use client'

import { useState } from 'react'

interface AuditLog {
  id: string
  user_id: string | null
  user_name: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: '全部' },
  { value: 'course', label: 'course' },
  { value: 'company', label: 'company' },
  { value: 'profile', label: 'profile' },
  { value: 'document', label: 'document' },
  { value: 'survey', label: 'survey' },
]

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
}

function getActionColor(action: string) {
  const lower = action.toLowerCase()
  if (lower.includes('create') || lower.includes('add')) return ACTION_COLORS.create
  if (lower.includes('delete') || lower.includes('remove')) return ACTION_COLORS.delete
  return ACTION_COLORS.update
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export function AuditLogClient({ initialLogs }: { initialLogs: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)
  const [entityFilter, setEntityFilter] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(initialLogs.length)

  const fetchLogs = async (p: number, entityType: string, userQuery: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), limit: '50' })
      if (entityType) params.set('entity_type', entityType)
      if (userQuery) params.set('user_id', userQuery)
      const res = await fetch(`/api/audit-log?${params}`)
      if (res.ok) {
        const json = await res.json()
        setLogs(json.data)
        setTotal(json.total)
        setPage(p)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEntityFilter = (v: string) => {
    setEntityFilter(v)
    fetchLogs(1, v, userSearch)
  }

  const handleUserSearch = (v: string) => {
    setUserSearch(v)
    // debounce not needed for now; user presses enter or we filter client-side
  }

  const filteredLogs = logs.filter(log => {
    if (entityFilter && log.entity_type !== entityFilter) return false
    if (userSearch && !(log.user_name || '').toLowerCase().includes(userSearch.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-xs text-gray-500 block mb-1">對象類型</label>
          <select
            value={entityFilter}
            onChange={e => handleEntityFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {ENTITY_TYPE_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">使用者搜尋</label>
          <input
            type="text"
            value={userSearch}
            onChange={e => handleUserSearch(e.target.value)}
            placeholder="輸入使用者名稱..."
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {loading && <span className="text-xs text-gray-400 self-end pb-1">載入中...</span>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">時間</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">使用者</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">操作</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">對象類型</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">對象ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">詳情</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-400 py-12">尚無操作紀錄</td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const hasDetails = log.details && Object.keys(log.details).length > 0
                  const isExpanded = expandedId === log.id
                  return (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatTime(log.created_at)}</td>
                      <td className="px-4 py-3 text-gray-700">{log.user_name || log.user_id?.slice(0, 8) || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.entity_type}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.entity_id?.slice(0, 8) || '-'}</td>
                      <td className="px-4 py-3">
                        {hasDetails ? (
                          <div>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              {isExpanded ? '收合' : '展開'}
                            </button>
                            {isExpanded && (
                              <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap break-all bg-gray-50 rounded-lg border border-gray-200 p-3 max-h-48 overflow-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">共 {total} 筆紀錄</p>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLogs(page - 1, entityFilter, '')}
              disabled={page <= 1 || loading}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              上一頁
            </button>
            <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
            <button
              onClick={() => fetchLogs(page + 1, entityFilter, '')}
              disabled={page >= totalPages || loading}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
