import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPrivateRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/dashboard/tournament/submissions/bookbuilder')

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup')

  // Skip auth check entirely for routes that don't need it
  if (!isPrivateRoute && !isPublicRoute) return NextResponse.next({ request })

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Helper: build a redirect that carries any cookies Supabase wrote during getUser()
  const redirectWithCookies = (dest: string) => {
    const url = request.nextUrl.clone()
    url.pathname = dest
    const redirectResponse = NextResponse.redirect(url)
    response.cookies.getAll().forEach(({ name, value }) =>
      redirectResponse.cookies.set(name, value, response.cookies.get(name) as any)
    )
    return redirectResponse
  }

  // Redirect unauthenticated users away from protected pages
  if (!user && isPrivateRoute) return redirectWithCookies('/login')

  // Redirect authenticated users away from login/signup
  if (user && isPublicRoute) return redirectWithCookies('/dashboard')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
