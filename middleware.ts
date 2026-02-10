import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fast path: any public route with no auth cookies — skip Supabase entirely (biggest perf win)
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"))
  const publicRoutes = ['/login', '/signup', '/blog', '/teachers', '/courses', '/certificate', '/forgot-password', '/about']
  const isPublicRoute = pathname === '/' || publicRoutes.some((route) => pathname.startsWith(route))
  if (isPublicRoute && !hasAuthCookie) {
    return NextResponse.next({
      request: { headers: request.headers },
    })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // If there's an auth error, clear it and treat as unauthenticated
  if (userError && !user) {
    // User is not authenticated, will be handled below
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Get user profile for role-based routing and redirects (only when user is logged in)
  let profile: { role: string } | null = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    profile = profileData
  }

  if (user && profile) {
    const role = profile.role

    // Logged-in user on landing → send to dashboard (correct page)
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Logged-in user on /dashboard (no role in path) → send to role-specific dashboard
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      const rolePath = role === 'admin' ? 'admin' : role === 'teacher' ? 'teacher' : 'student'
      return NextResponse.redirect(new URL(`/dashboard/${rolePath}`, request.url))
    }

    // Logged-in user on auth pages → send to dashboard
    if (isPublicRoute && ['/login', '/signup'].some((r) => pathname === r)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Role-based route protection: wrong role on admin/teacher/student routes
    if (pathname.startsWith('/dashboard/admin')) {
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    if (pathname.startsWith('/dashboard/teacher')) {
      if (role !== 'teacher') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    if (pathname.startsWith('/dashboard/student')) {
      if (role !== 'student') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
