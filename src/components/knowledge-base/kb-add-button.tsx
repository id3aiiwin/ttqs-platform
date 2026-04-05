'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createTemplate } from '@/app/(dashboard)/knowledge-base/actions'
import { Button } from '@/components/ui/button'

export function KbAddButton() {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [fileUrl, setFileUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData(); fd.append('file', file); fd.append('folder', 'knowledge-base')
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) setFileUrl(data.path)
      else alert(data.error || '上傳失敗')
    } catch { alert('上傳失敗') }
    setUploading(false)
  }

  function handleSubmit(formData: FormData) {
    formData.set('file_url', fileUrl)
    startTransition(async () => {
      await createTemplate(formData)
      setOpen(false); setFileUrl(''); router.refresh()
    })
  }

  if (!open) return <Button onClick={() => setOpen(true)}>+ 新增範本</Button>

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 w-96">
      <h3 className="font-semibold text-gray-900 mb-3">新增範本</h3>
      <form action={handleSubmit} className="flex flex-col gap-3">
        <input name="name" required placeholder="範本名稱 *" className="text-sm border border-gray-300 rounded-lg px-3 py-2" />
        <input name="doc_number_format" placeholder="文件編號格式（如 1QM-[企業代碼]-001）" className="text-sm border border-gray-300 rounded-lg px-3 py-2" />
        <div className="grid grid-cols-2 gap-2">
          <select name="pddro_phase" defaultValue="general" className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
            <option value="general">通用</option>
            <option value="P">Plan</option><option value="D">Design</option>
            <option value="DO">Do</option><option value="R">Review</option><option value="O">Outcome</option>
          </select>
          <select name="tier" className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
            <option value="">無階層</option>
            <option value="1">一階</option><option value="2">二階</option>
            <option value="3">三階</option><option value="4">四階</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="version" placeholder="版本號" className="text-sm border border-gray-300 rounded-lg px-3 py-2" />
          <input name="ttqs_indicator" placeholder="TTQS 指標" className="text-sm border border-gray-300 rounded-lg px-3 py-2" />
        </div>
        <select name="access_level" defaultValue="all" className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white">
          <option value="all">全部企業</option>
          <option value="specific">指定企業</option>
          <option value="internal">顧問內部</option>
        </select>
        <div>
          <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 w-full text-left">
            {uploading ? '上傳中...' : fileUrl ? '✓ 已上傳' : '選擇文件'}
          </button>
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={pending}>新增</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>取消</Button>
        </div>
      </form>
    </div>
  )
}
