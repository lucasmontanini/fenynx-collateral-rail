import { LASTRO_TERRE02 } from '../domain/lastro'

export interface Anuncio {
  preco: number
  areaM2: number
}

/** Le ao vivo o preco e a area do anuncio de referencia. Nulo se o anuncio saiu do ar ou mudou de formato. */
export async function lerAnuncio(): Promise<Anuncio | null> {
  try {
    const resposta = await fetch(LASTRO_TERRE02.mercado.anuncioUrl, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FenynxMonitor/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!resposta.ok) return null
    const html = await resposta.text()
    const preco = Number(/"price":\s*"([\d.]+)"/.exec(html)?.[1])
    const areaM2 = Number(/([\d.]+)\s*m&sup2;/.exec(html)?.[1])
    return Number.isFinite(preco) && preco > 0 && Number.isFinite(areaM2) && areaM2 > 0 ? { preco, areaM2 } : null
  } catch {
    return null
  }
}
