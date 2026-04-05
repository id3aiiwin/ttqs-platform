'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  users: { id: string; name: string }[]
  currentViewId: string | null
}

export function TalentSearchClient({ users, currentViewId }: Props) {
  const [search, setSearch] = useState('')
  const router = useRouter()

  const filtered = search
    ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))
    : users

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-3">
        <p className="text-sm font-medium text-gray-700">查看其他人的報告</p>
        {currentViewId && (
          <button onClick={() => router.push('/my-talent')}
            className="text-xs text-indigo-600 hover:text-indigo-700">回到我的報告</button>
        )}
      </div>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="搜尋姓名..."
        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {search && (
        <div className="max-h-40 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">找不到符合的用戶</p>
          ) : filtered.map(u => (
            <button key={u.id} onClick={() => { router.push(`/my-talent?view=${u.id}`); setSearch('') }}
              className={`w-full text-left px-3 py-1.5 text-sm rounded hover:bg-indigo-50 ${currentViewId === u.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'}`}>
              {u.name}
            </button>
          ))}
        </div>
      )}
      {!search && users.length > 0 && (
        <p className="text-xs text-gray-400">共 {users.length} 位已完成評量</p>
      )}
    </div>
  )
}
