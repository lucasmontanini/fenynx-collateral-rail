import type { Ativo } from './domain/case'

export interface FontePreco {
  nome: string
  valor: number
}

export interface Cotacao {
  valor: number
  fontes: FontePreco[]
}

async function buscar(url: string, extrair: (corpo: unknown) => unknown): Promise<number | null> {
  try {
    const resposta = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(6000) })
    if (!resposta.ok) return null
    const valor = Number(extrair(await resposta.json()))
    return Number.isFinite(valor) && valor > 0 ? valor : null
  } catch {
    return null
  }
}

function campo(objeto: unknown, chave: string): unknown {
  return objeto !== null && typeof objeto === 'object' ? (objeto as Record<string, unknown>)[chave] : undefined
}

/** Preco de mercado em real, media de duas fontes independentes. */
export async function cotacaoDeMercado(ativo: Exclude<Ativo, 'MPT'>): Promise<Cotacao | null> {
  const [coinbase, mercadoBitcoin] = await Promise.all([
    buscar(`https://api.coinbase.com/v2/prices/${ativo}-BRL/spot`, (c) => campo(campo(c, 'data'), 'amount')),
    buscar(`https://www.mercadobitcoin.net/api/${ativo}/ticker/`, (c) => campo(campo(c, 'ticker'), 'last')),
  ])
  const fontes: FontePreco[] = []
  if (coinbase !== null) fontes.push({ nome: 'Coinbase', valor: coinbase })
  if (mercadoBitcoin !== null) fontes.push({ nome: 'Mercado Bitcoin', valor: mercadoBitcoin })
  if (fontes.length === 0) return null
  return { valor: fontes.reduce((soma, f) => soma + f.valor, 0) / fontes.length, fontes }
}

export interface PontoPreco {
  dia: string
  valor: number
}

/** Fechamento diario dos ultimos 30 dias em real, pelo Mercado Bitcoin. */
export async function historicoDePreco(ativo: Exclude<Ativo, 'MPT'>): Promise<PontoPreco[]> {
  try {
    const ate = Math.floor(Date.now() / 1000)
    const resposta = await fetch(
      `https://api.mercadobitcoin.net/api/v4/candles?symbol=${ativo}-BRL&resolution=1d&to=${ate}&countback=30`,
      { cache: 'no-store', signal: AbortSignal.timeout(6000) },
    )
    if (!resposta.ok) return []
    const corpo: unknown = await resposta.json()
    const tempos = campo(corpo, 't')
    const fechamentos = campo(corpo, 'c')
    if (!Array.isArray(tempos) || !Array.isArray(fechamentos)) return []
    return tempos.flatMap((t, i) => {
      const valor = Number(fechamentos[i])
      return typeof t === 'number' && Number.isFinite(valor)
        ? [{ dia: new Date(t * 1000).toISOString().slice(0, 10), valor }]
        : []
    })
  } catch {
    return []
  }
}
