'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  message: string
  icon: string
  is_read: boolean
  link: string | null
  created_at: string
}

type Filter = 'all' | 'unread' | 'read'

function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)

  const groups: Record<string, Notification[]> = { '今天': [], '昨天': [], '更早': [] }

  for (const n of notifications) {
    const d = new Date(n.created_at)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (day.getTime() === today.getTime()) groups['今天'].push(n)
    else if (day.getTime() === yesterday.getTime()) groups['昨天'].push(n)
    else groups['更早'].push(n)
  }

  return (['今天', '昨天', '更早'] as const)
    .filter(label => groups[label].length > 0)
    .map(label => ({ label, items: groups[label] }))
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.toLocaleDateString('zh-TW')} ${d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`
}

export function NotificationsClient({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial)
  const [filter, setFilter] = useState<Filter>('all')
  const router = useRouter()

  const unreadCount = notifications.filter(n => !n.is_read).length
  const todayCount = notifications.filter(n => {
    const d = new Date(n.created_at)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  }).length

  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.is_read)
    : notifications.filter(n => n.is_read)

  const groups = groupByDate(filtered)

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  function handleClick(n: Notification) {
    if (!n.is_read) markRead(n.id)
    if (n.link) router.push(n.link)
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unread', label: '未讀' },
    { key: 'read', label: '已讀' },
  ]

  return (
    <div>
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">總通知數</p>
          <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">未讀</p>
          <p className="text-2xl font-bold text-indigo-600">{unreadCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">今日新增</p>
          <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
        </div>
      </div>

      {/* Filter tabs + mark all read */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            全部已讀
          </button>
        )}
      </div>

      {/* Notification list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 py-16 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm text-gray-400">
            {filter === 'unread' ? '沒有未讀通知' : filter === 'read' ? '沒有已讀通知' : '沒有通知'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.label}</p>
              <div className="space-y-2">
                {group.items.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left bg-white rounded-lg border border-gray-200 px-4 py-3 hover:shadow-sm hover:border-gray-300 transition-all ${
                      !n.is_read ? 'ring-1 ring-indigo-100' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">{n.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.is_read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">{formatTime(n.created_at)}</p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
