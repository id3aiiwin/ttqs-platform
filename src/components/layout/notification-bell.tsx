'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Notification {
  id: string; message: string; icon: string; is_read: boolean; created_at: string
}

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // 30秒 polling
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch(`/api/notifications?user_id=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
      }
    } catch { /* ignore */ }
  }

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

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">通知</p>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-600 hover:text-indigo-700">全部已讀</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">沒有通知</p>
            ) : notifications.map(n => (
              <button key={n.id} onClick={() => markRead(n.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!n.is_read ? 'bg-indigo-50/50' : ''}`}>
                <div className="flex gap-2">
                  <span className="text-lg flex-shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{n.message}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleDateString('zh-TW')} {new Date(n.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {!n.is_read && <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />}
                </div>
              </button>
            ))}
          </div>
          <Link href="/notifications" className="block text-center text-xs text-indigo-600 hover:text-indigo-700 py-2 border-t border-gray-100">
            查看全部通知
          </Link>
        </div>
      )}
    </div>
  )
}
