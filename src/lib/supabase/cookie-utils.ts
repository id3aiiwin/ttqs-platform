/**
 * 把 Supabase 預設的長效 auth cookie 轉成 session cookie。
 * 拿掉 maxAge/expires 後，瀏覽器關閉即失效，使用者必須重新登入。
 * maxAge <= 0（刪除 cookie）保留不動。
 */
type SupabaseCookieOptions = {
  maxAge?: number
  expires?: Date
  [k: string]: unknown
}

export function toSessionCookie<T extends SupabaseCookieOptions | undefined>(options: T): T {
  if (!options) return options
  if (typeof options.maxAge === 'number' && options.maxAge > 0) {
    const next = { ...options }
    delete next.maxAge
    delete next.expires
    return next as T
  }
  return options
}
