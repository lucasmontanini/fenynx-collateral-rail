import { ATESTADO_DOCUMENTOS } from '../lib/domain/lastro'
import { lerAnuncio } from '../lib/lastro/anuncio'
import { comLedger } from '../lib/xrpl/servidor'

/** Grava no ledger o primeiro atestado do lastro, com os numeros dos documentos e o anuncio lido agora. */
const anuncio = await lerAnuncio()
const recibo = await comLedger(({ ledger }) =>
  ledger.registrarAtestado({
    ...ATESTADO_DOCUMENTOS,
    precoAnuncio: anuncio?.preco ?? null,
    areaAnuncioM2: anuncio?.areaM2 ?? null,
  }),
)
console.log('anuncio', anuncio, recibo.link)
