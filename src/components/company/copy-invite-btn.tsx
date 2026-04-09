'use client'

import { useState } from 'react'

export function CopyInviteBtn({ companyId }: { companyId: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/auth/login?company=${companyId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={handleCopy} className="text-gray-400 hover:text-indigo-600 text-xs font-medium whitespace-nowrap">
      {copied ? '已複製!' : '註冊連結'}
    </button>
  )
}
