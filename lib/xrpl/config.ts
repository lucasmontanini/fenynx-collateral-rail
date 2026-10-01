import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Wallet } from 'xrpl'

export const PAPEIS = [
  'EMISSOR_BRL',
  'FENYNX',
  'AGENTE_GARANTIA',
  'INVESTIDOR',
  'TOMADOR',
  'FORMADOR_MERCADO',
  'TOKENIZADORA',
] as const

export type Papel = (typeof PAPEIS)[number]

export const ARQUIVO_ENV = resolve(process.cwd(), '.env.local')
export const WSS_PADRAO = 'wss://s.devnet.rippletest.net:51233'
export const EXPLORER = 'https://devnet.xrpl.org'
/** Endereco publico do portal, usado nos links gravados nos metadados dos tokens. */
export const URL_PORTAL = 'https://fenynx-collateral-rail.vercel.app'

/** Stablecoin de real usada no vault. Na Devnet e um token de teste que faz o papel do BBRL. */
export const MOEDA_BRL = 'BRL'

function lerEnvLocal(): Record<string, string> {
  if (!existsSync(ARQUIVO_ENV)) return {}
  const pares: Record<string, string> = {}
  for (const linha of readFileSync(ARQUIVO_ENV, 'utf8').split('\n')) {
    const limpa = linha.trim()
    if (!limpa || limpa.startsWith('#')) continue
    const corte = limpa.indexOf('=')
    if (corte < 0) continue
    pares[limpa.slice(0, corte).trim()] = limpa.slice(corte + 1).trim()
  }
  return pares
}

export function variavel(nome: string): string | undefined {
  return process.env[nome] ?? lerEnvLocal()[nome]
}

export function enderecoWss(): string {
  return variavel('XRPL_WSS') ?? WSS_PADRAO
}

export function carteira(papel: Papel): Wallet {
  const seed = variavel(`SEED_${papel}`)
  if (!seed) {
    throw new Error(`SEED_${papel} ausente em .env.local. Rode npm run setup.`)
  }
  return Wallet.fromSeed(seed)
}

export function carteiras(): Record<Papel, Wallet> {
  const todas = {} as Record<Papel, Wallet>
  for (const papel of PAPEIS) todas[papel] = carteira(papel)
  return todas
}
