'use client'

interface Props {
  title: string
  contentUrl: string
}

export function EbookReader({ title, contentUrl }: Props) {
  // Google Drive URL 轉換為 preview
  const previewUrl = contentUrl
    .replace('/view', '/preview')
    .replace('/edit', '/preview')

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <span className="text-xs text-gray-400">僅限購買者閱讀</span>
      </div>
      <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ height: '75vh', minHeight: '520px' }}>
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          style={{ userSelect: 'none' }}
          onContextMenu={e => e.preventDefault()}
        />
      </div>
    </div>
  )
}
