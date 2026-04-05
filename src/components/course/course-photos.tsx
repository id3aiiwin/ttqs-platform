'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

interface Photo { id: string; file_url: string; created_at: string }

export function CoursePhotos({ courseId, companyId, photos: initialPhotos }: {
  courseId: string; companyId: string; photos: Photo[]
}) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', `course-photos/${courseId}`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.path) {
        // 寫入 course_photos
        const saveRes = await fetch('/api/course-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ course_id: courseId, file_url: data.path }),
        })
        const saved = await saveRes.json()
        if (saved.id) {
          setPhotos((prev) => [...prev, { id: saved.id, file_url: data.path, created_at: new Date().toISOString() }])
          router.refresh()
        }
      } else alert(data.error || '上傳失敗')
    } catch { alert('上傳失敗') }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleDelete(photoId: string) {
    if (!confirm('確定刪除此照片？')) return
    const res = await fetch('/api/course-photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: photoId }),
    })
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId))
      router.refresh()
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-700">上課照片</p>
          <Badge variant={photos.length >= 2 ? 'success' : photos.length > 0 ? 'warning' : 'default'}>
            {photos.length}/2 張
          </Badge>
        </div>
        {photos.length < 2 && (
          <>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              {uploading ? '上傳中...' : '+ 上傳照片'}
            </button>
          </>
        )}
      </div>

      {photos.length === 0 ? (
        <p className="text-xs text-gray-400">尚未上傳上課照片（需上傳 2 張作為 TTQS 佐證）</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
              <img
                src={`${supabaseUrl}/storage/v1/object/public/documents/${photo.file_url}`}
                alt="上課照片"
                className="w-full h-32 object-cover"
              />
              <button onClick={() => handleDelete(photo.id)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
