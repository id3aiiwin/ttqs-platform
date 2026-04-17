import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { toSessionCookie } from './cookie-utils'

function parseCookies(cookieString: string) {
  if (!cookieString) return []
  return cookieString.split('; ').filter(Boolean).map(part => {
    const eq = part.indexOf('=')
    const name = eq >= 0 ? part.slice(0, eq) : part
    const value = eq >= 0 ? decodeURIComponent(part.slice(eq + 1)) : ''
    return { name, value }
  })
}

type WriteOpts = {
  path?: string
  domain?: string
  sameSite?: boolean | 'lax' | 'strict' | 'none'
  secure?: boolean
  maxAge?: number
  expires?: Date
  httpOnly?: boolean
}

function serialize(name: string, value: string, options: WriteOpts = {}) {
  let out = `${name}=${encodeURIComponent(value)}`
  if (options.path) out += `; Path=${options.path}`
  if (options.domain) out += `; Domain=${options.domain}`
  if (typeof options.maxAge === 'number') out += `; Max-Age=${Math.floor(options.maxAge)}`
  if (options.expires) out += `; Expires=${options.expires.toUTCString()}`
  if (options.sameSite) {
    const s = options.sameSite === true ? 'Strict' : String(options.sameSite)
    out += `; SameSite=${s.charAt(0).toUpperCase()}${s.slice(1)}`
  }
  if (options.secure) out += `; Secure`
  return out
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return parseCookies(document.cookie)
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serialize(name, value, toSessionCookie(options))
          })
        },
      },
    }
  )
}
