import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: '請提供電子郵件' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ttqs-platform.vercel.app'
    const supabase = createServiceClient()

    // 用 admin API 產生重設連結，不依賴 Supabase SMTP
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${appUrl}/auth/confirm`,
      },
    })

    if (error || !data?.properties?.action_link) {
      console.error('generateLink error:', error)
      // 不透露用戶是否存在（安全性考量），回傳成功
      return NextResponse.json({ success: true })
    }

    const resetLink = data.properties.action_link

    // 用 Resend HTTP API 寄信
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: '【人才發展管理系統】密碼重設連結',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #4f46e5;">密碼重設</h2>
          <p>您好，</p>
          <p>我們收到您的密碼重設請求。請點擊下方按鈕重設您的密碼：</p>
          <a href="${resetLink}"
            style="display: inline-block; margin: 24px 0; padding: 12px 24px;
                   background-color: #4f46e5; color: white; text-decoration: none;
                   border-radius: 8px; font-weight: bold;">
            重設密碼
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            此連結將在 1 小時後失效。<br>
            若您未申請密碼重設，請忽略此郵件。
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px;">
            人才發展管理系統 ─ 社團法人國際評量應用發展協會
          </p>
        </div>
      `,
    })

    if (sendError) {
      console.error('Resend send error:', sendError)
      return NextResponse.json({ error: '郵件發送失敗，請稍後再試' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('forgot-password error:', err)
    return NextResponse.json({ error: '伺服器錯誤，請稍後再試' }, { status: 500 })
  }
}
