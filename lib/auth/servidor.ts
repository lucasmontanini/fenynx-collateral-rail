import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_SESSAO, lerToken } from './sessao'

export async function emailDaSessao(): Promise<string | null> {
  return lerToken((await cookies()).get(COOKIE_SESSAO)?.value)
}

export async function exigirSessao(): Promise<string> {
  const email = await emailDaSessao()
  if (!email) redirect('/login')
  return email
}
