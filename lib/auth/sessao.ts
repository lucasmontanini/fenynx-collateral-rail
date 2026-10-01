import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto'

export const COOKIE_SESSAO = 'fx_sessao'
const VALIDADE_SEGUNDOS = 60 * 60 * 12

function segredo(): string {
  const valor = process.env.AUTH_SEGREDO
  if (!valor) throw new Error('AUTH_SEGREDO ausente')
  return valor
}

function assinar(conteudo: string): string {
  return createHmac('sha256', segredo()).update(conteudo).digest('base64url')
}

function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export function criarToken(email: string): { token: string; maxAge: number } {
  const expira = Math.floor(Date.now() / 1000) + VALIDADE_SEGUNDOS
  const conteudo = Buffer.from(JSON.stringify({ email, expira })).toString('base64url')
  return { token: `${conteudo}.${assinar(conteudo)}`, maxAge: VALIDADE_SEGUNDOS }
}

export function lerToken(token: string | undefined): string | null {
  if (!token) return null
  const [conteudo, assinatura] = token.split('.')
  if (!conteudo || !assinatura || !iguais(assinatura, assinar(conteudo))) return null
  try {
    const dados: unknown = JSON.parse(Buffer.from(conteudo, 'base64url').toString('utf8'))
    if (dados === null || typeof dados !== 'object') return null
    const { email, expira } = dados as { email?: unknown; expira?: unknown }
    if (typeof email !== 'string' || typeof expira !== 'number') return null
    return expira > Date.now() / 1000 ? email : null
  } catch {
    return null
  }
}

/** Confere e-mail e senha contra AUTH_EMAIL e AUTH_SENHA_HASH (formato sal:hash, scrypt). */
export function credenciaisValidas(email: string, senha: string): boolean {
  const emailEsperado = process.env.AUTH_EMAIL
  const [sal, hash] = (process.env.AUTH_SENHA_HASH ?? '').split(':')
  if (!emailEsperado || !sal || !hash) return false
  const calculado = scryptSync(senha, sal, 32).toString('hex')
  return iguais(email.trim().toLowerCase(), emailEsperado.toLowerCase()) && iguais(calculado, hash)
}
