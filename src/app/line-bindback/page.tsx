import { LineBindClient } from './line-bind-client'

export const metadata = { title: 'LINE 帳號綁定 | ID3A 管理平台' }

export default async function LineBindPage({
  searchParams,
}: {
  searchParams: Promise<{ uid?: string }>
}) {
  const { uid } = await searchParams

  if (!uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-gray-500">無效的綁定連結</p>
          <p className="text-xs text-gray-400 mt-1">請從 LINE 官方帳號取得綁定連結</p>
        </div>
      </div>
    )
  }

  return <LineBindClient lineUserId={uid} />
}
