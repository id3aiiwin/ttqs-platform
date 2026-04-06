import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!

/** 驗證 LINE Webhook 簽名 */
function verifySignature(body: string, signature: string): boolean {
  const hash = crypto.createHmac('SHA256', CHANNEL_SECRET).update(body).digest('base64')
  return hash === signature
}

/** 回覆訊息給使用者 */
async function replyMessage(replyToken: string, messages: { type: string; text: string }[]) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-line-signature') ?? ''

  // 驗證簽名
  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const data = JSON.parse(body)
  const events = data.events ?? []

  for (const event of events) {
    // 加好友事件
    if (event.type === 'follow') {
      const userId = event.source?.userId
      if (userId && event.replyToken) {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://id3a.vercel.app'
        await replyMessage(event.replyToken, [
          {
            type: 'text',
            text: `歡迎加入 ID3A 管理平台！\n\n請點擊以下連結綁定您的帳號，即可接收課程通知：\n\n${baseUrl}/line-bindback?uid=${userId}\n\n綁定後即可收到上課通知、問卷提醒等訊息。`,
          },
        ])
      }
    }

    // 收到文字訊息事件
    if (event.type === 'message' && event.message?.type === 'text') {
      const userId = event.source?.userId
      const text = (event.message.text ?? '').trim()

      if (userId && event.replyToken) {
        // 輸入「綁定」觸發綁定流程
        if (text === '綁定' || text === '綁定帳號' || text === 'bind') {
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://id3a.vercel.app'
          await replyMessage(event.replyToken, [
            {
              type: 'text',
              text: `請點擊以下連結綁定您的 ID3A 帳號：\n\n${baseUrl}/line-bindback?uid=${userId}\n\n綁定完成後即可接收課程通知。`,
            },
          ])
        }
      }
    }
  }

  return NextResponse.json({ ok: true })
}

/** LINE Webhook 驗證（GET） */
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
