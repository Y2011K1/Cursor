import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication (landing at /, auth pages, blog, teachers, certificate verification)
  const publicRoutes = ['/login', '/signup', '/blog', '/teachers', '/courses', '/certificate', '/forgot-password', '/about']
  const isPublicRoute = pathname === '/' || publicRoutes.some((route) => pathname.startsWith(route))

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  // Allow client-side redirect to happen first, middleware will catch it on next request
  if (user && isPublicRoute) {
    // Don't redirect here - let the client-side redirect work
    // The middleware will redirect on the next navigation if needed
  }

  // Get user profile for role-based routing
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile) {
      // Role-based route protection
      const role = profile.role

      // Admin routes
      if (pathname.startsWith('/admin')) {
        if (role !== 'admin') {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/dashboard'
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Teacher routes
      if (pathname.startsWith('/teacher')) {
        if (role !== 'teacher') {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/dashboard'
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Student routes
      if (pathname.startsWith('/student')) {
        if (role !== 'student') {
          const redirectUrl = request.nextUrl.clone()
          redirectUrl.pathname = '/dashboard'
          return NextResponse.redirect(redirectUrl)
        }
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
