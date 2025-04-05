import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers }
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers }
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers }
          })
          response.cookies.delete(name)
        }
      }
    }
  )

  // Refresh expired session
  const { data: { session }, error } = await supabase.auth.getSession()
  if (!session) await supabase.auth.refreshSession()

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  // Define public paths
  const publicPaths = ['/', '/login', '/signup', '/reset-password']
  const currentPath = request.nextUrl.pathname

  // Redirect unauthenticated users
  if (!user && !publicPaths.includes(currentPath)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role verification (both JWT and database)
  if (user) {
    // Get user type from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    const userType = profile?.user_type || user.user_metadata?.user_type
    
    // Doctor route protection
    if (currentPath.startsWith('/dashboard/doctor') && userType !== 'doctor') {
      return NextResponse.redirect(new URL('/login/doctor', request.url))
    }

    // Patient route protection
    if (currentPath.startsWith('/dashboard/patient') && userType !== 'patient') {
      return NextResponse.redirect(new URL('/login/patient', request.url))
    }
  }

  return response
}
