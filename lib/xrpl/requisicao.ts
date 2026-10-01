import { cache } from 'react'
import { carregarPainel, type Painel } from './leitura'
import { comLedger } from './servidor'

/** Painel lido uma unica vez por requisicao, compartilhado entre layout e pagina. */
export const painelDaRequisicao = cache((): Promise<Painel> => comLedger(carregarPainel))
