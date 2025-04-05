import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => {
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${key}=`))
          return cookie ? cookie.split('=')[1] : undefined
        },
        set: (key, value, options) => {
          document.cookie = `${key}=${value}; Path=/; ${
            options?.secure ? 'Secure;' : ''
          } SameSite=Lax; ${options?.maxAge ? `Max-Age=${options.maxAge};` : ''}`
        },
        remove: (key) => {
          document.cookie = `${key}=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`
        }
      }
    }
  )
}
