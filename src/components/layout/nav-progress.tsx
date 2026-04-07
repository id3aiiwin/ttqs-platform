'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 頂部導航進度條：頁面切換時顯示載入動畫。
 * 偵測 pathname 變化來判斷導航開始/結束。
 */
export function NavProgress() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const prevPath = useRef(pathname)

  useEffect(() => {
    // pathname 變了 = 導航完成
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      setLoading(false)
    }
  }, [pathname])

  useEffect(() => {
    // 攔截所有 link click 事件，判斷是否為導航
    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest('a')
      if (!link) return
      const href = link.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return
      if (href === pathname) return
      // 是站內導航，開始顯示進度條
      setLoading(true)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5">
      <div className="h-full bg-indigo-600 animate-progress-bar" />
      <style>{`
        @keyframes progress-bar {
          0% { width: 0% }
          20% { width: 30% }
          50% { width: 60% }
          80% { width: 85% }
          100% { width: 95% }
        }
        .animate-progress-bar {
          animation: progress-bar 8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
