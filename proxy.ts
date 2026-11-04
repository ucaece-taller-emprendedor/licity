import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Primera barrera de acceso (optimista, solo mira si existe la cookie de sesión).
 * La validación real del rol se hace en el servidor: `requireRole` en los layouts
 * y `requireRoleForAction` en cada server action.
 */
const PUBLIC_APP_PATHS = ['/app/ingresar', '/app/registro', '/app/recuperar']

const isPublicApp = (p: string) =>
  PUBLIC_APP_PATHS.some((base) => p === base || p.startsWith(`${base}/`))

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(getSessionCookie(request))

  if (!hasSession) {
    if (pathname === '/admin' || (pathname.startsWith('/admin/') && pathname !== '/admin/ingresar')) {
      return NextResponse.redirect(new URL('/admin/ingresar', request.url))
    }
    if ((pathname === '/app' || pathname.startsWith('/app/')) && !isPublicApp(pathname)) {
      return NextResponse.redirect(new URL('/app/ingresar', request.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
}
