import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESSAO, lerToken } from './lib/auth/sessao'

export function proxy(request: NextRequest): NextResponse {
  const logado = lerToken(request.cookies.get(COOKIE_SESSAO)?.value) !== null
  const naTelaDeLogin = request.nextUrl.pathname === '/login'
  if (!logado && !naTelaDeLogin) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (logado && naTelaDeLogin) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-fenynx.svg|ativos/).*)'],
}
