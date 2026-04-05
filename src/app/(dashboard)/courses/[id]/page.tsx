import { redirect } from 'next/navigation'

// 課程詳情改為在列表頁的右側面板顯示
export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/courses?selected=${id}`)
}
