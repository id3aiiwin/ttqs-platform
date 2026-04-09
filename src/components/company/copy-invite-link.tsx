'use client'

import { useState } from 'react'
import { Card, CardBody } from '@/components/ui/card'

export function CopyInviteLink({ companyId }: { companyId: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `${window.location.origin}/auth/login?company=${companyId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={handleCopy} className="text-left">
      <Card className="hover:border-indigo-200 transition-colors cursor-pointer h-full">
        <CardBody className="flex items-center gap-3">
          <span className="text-2xl">{copied ? '\u2705' : '\u{1F517}'}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {copied ? '已複製！' : '同仁註冊連結'}
            </p>
            <p className="text-xs text-gray-400">複製專屬註冊連結</p>
          </div>
        </CardBody>
      </Card>
    </button>
  )
}
