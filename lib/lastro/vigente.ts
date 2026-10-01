import { ATESTADO_DOCUMENTOS, LASTRO_TERRE02, scoreDoLastro, type Atestado, type AtestadoGravado, type Score } from '../domain/lastro'
import { carregarAtestados } from '../xrpl/leitura'
import { comLedger } from '../xrpl/servidor'
import { lerAnuncio, type Anuncio } from './anuncio'

export interface LastroVigente {
  atestados: AtestadoGravado[]
  anuncio: Anuncio | null
  /** Ultimo atestado gravado, ou os numeros dos documentos, com o preco do anuncio lido agora. */
  vigente: Atestado
  score: Score
}

/** Retrato atual do lastro do TERRE02: ledger mais mercado. */
export async function carregarLastroVigente(): Promise<LastroVigente> {
  const [atestados, anuncio] = await Promise.all([
    comLedger((ctx) => carregarAtestados(ctx, LASTRO_TERRE02.ticker)),
    lerAnuncio(),
  ])
  const base = atestados[0] ?? ATESTADO_DOCUMENTOS
  const vigente = { ...base, precoAnuncio: anuncio?.preco ?? null, areaAnuncioM2: anuncio?.areaM2 ?? null }
  return { atestados, anuncio, vigente, score: scoreDoLastro(vigente, Date.now()) }
}
