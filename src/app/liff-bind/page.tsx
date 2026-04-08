import { LiffBindFlow } from './liff-bind-flow'

export const metadata = { title: 'LINE 快速綁定 | ID3A 管理平台' }

export default async function LiffBindPage({
  searchParams,
}: {
  searchParams: Promise<{ course_id?: string; company_id?: string; pid?: string }>
}) {
  const { course_id, company_id, pid } = await searchParams

  if (!course_id && !company_id && !pid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-gray-500">無效的綁定連結</p>
          <p className="text-xs text-gray-400 mt-1">請從講師或顧問取得正確的綁定 QR Code</p>
        </div>
      </div>
    )
  }

  return <LiffBindFlow courseId={course_id} companyId={company_id} profileId={pid} />
}
