import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getProfile } from '@/lib/get-profile'
import { Card, CardHeader, CardBody } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CoursePlayer } from '@/components/product-player/course-player'
import { QuizPlayer } from '@/components/product-player/quiz-player'
import { EbookReader } from '@/components/product-player/ebook-reader'

export const metadata = { title: '我的學習 | ID3A 管理平台' }

export default async function MyLearningPage({
  searchParams,
}: { searchParams: Promise<{ product?: string }> }) {
  const { product: viewProductId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const sc = createServiceClient()

  // 取得已購授權
  const { data: licenses } = await sc.from('user_licenses').select('product_id, status').eq('user_id', user.id).eq('status', 'active')
  const licensedIds = (licenses ?? []).map(l => l.product_id)

  // 取得產品
  const { data: products } = licensedIds.length > 0
    ? await sc.from('products').select('*').in('id', licensedIds)
    : { data: [] }

  // 取得測驗結果
  const { data: quizResults } = await sc.from('quiz_results').select('*').eq('user_id', user.id).order('completed_at', { ascending: false })

  const TYPE_ICONS: Record<string, string> = { course: '🎓', quiz: '🧪', ebook: '📚' }

  // 查看特定產品
  const viewProduct = viewProductId ? (products ?? []).find(p => p.id === viewProductId) : null
  const productQuizResults = viewProduct ? (quizResults ?? []).filter(r => r.product_id === viewProduct.id) : []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的學習</h1>

      {viewProduct ? (
        /* 播放器 */
        <div>
          <a href="/my-learning" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">← 返回列表</a>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{TYPE_ICONS[viewProduct.type] ?? '📦'}</span>
              <h2 className="text-lg font-bold text-gray-900">{viewProduct.title}</h2>
              <Badge variant="info">{viewProduct.type === 'course' ? '線上課程' : viewProduct.type === 'quiz' ? '測驗' : '電子書'}</Badge>
            </div>

            {viewProduct.type === 'course' && (
              <CoursePlayer productTitle={viewProduct.title} units={(viewProduct.units ?? []) as { title: string; youtubeId?: string }[]} />
            )}
            {viewProduct.type === 'quiz' && viewProduct.content_url && (
              <QuizPlayer productId={viewProduct.id} contentUrl={viewProduct.content_url} userId={user.id}
                attempts={productQuizResults.map(r => ({ id: r.id, score: r.score, percentage: r.percentage, summary: r.summary, completed_at: r.completed_at }))} />
            )}
            {viewProduct.type === 'ebook' && viewProduct.content_url && (
              <EbookReader title={viewProduct.title} contentUrl={viewProduct.content_url} />
            )}
          </Card>
        </div>
      ) : (
        /* 產品列表 */
        <>
          {(!products || products.length === 0) ? (
            <Card><CardBody>
              <div className="text-center py-16">
                <p className="text-gray-400 mb-2">尚無已購課程</p>
                <a href="/shop" className="text-sm text-indigo-600 hover:text-indigo-700">前往課程商店 →</a>
              </div>
            </CardBody></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => {
                const pQuiz = (quizResults ?? []).filter(r => r.product_id === p.id)
                return (
                  <a key={p.id} href={`/my-learning?product=${p.id}`}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-sm transition-all">
                    {p.cover_image ? (
                      <img src={p.cover_image} alt={p.title} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                        <span className="text-4xl">{TYPE_ICONS[p.type] ?? '📦'}</span>
                      </div>
                    )}
                    <div className="p-4">
                      <Badge variant="info" className="mb-1">{p.type === 'course' ? '線上課程' : p.type === 'quiz' ? '測驗' : '電子書'}</Badge>
                      <p className="text-sm font-bold text-gray-900">{p.title}</p>
                      {p.type === 'course' && p.units && (
                        <p className="text-xs text-gray-400 mt-1">{(p.units as unknown[]).length} 個單元</p>
                      )}
                      {p.type === 'quiz' && pQuiz.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">已作答 {pQuiz.length} 次</p>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
