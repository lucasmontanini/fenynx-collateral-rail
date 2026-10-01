import type { PoliticaLTV } from './credito'

export type Ativo = 'XRP' | 'BTC' | 'MPT'
export type Produto = 'credito' | 'iphone'

export interface ModeloIphone {
  id: string
  nome: string
  precoBRL: number
}

export interface TokenGarantia {
  ticker: string
  emissor: string
  plataforma: string
  tipo: string
  rentabilidadeMensal: number
  vencimento: string
  ofertaBRL: number
  /** Valor de referencia de um token em real. */
  valorUnitario: number
  fonte: string
}

/**
 * Token de divida imobiliaria distribuido pela Zuvia. Dados lidos da pagina publica da oferta
 * em 30/09/2026. O valor unitario de 1 real e inferido: 781.250 tokens para uma oferta de R$ 781.250.
 */
export const TOKEN_TERRE02: TokenGarantia = {
  ticker: 'TERRE02',
  emissor: 'Blue Ventures',
  plataforma: 'Zuvia',
  tipo: 'Imobiliário',
  rentabilidadeMensal: 0.014,
  vencimento: '2027-09-21',
  ofertaBRL: 781250,
  valorUnitario: 1,
  fonte: 'https://app.zuvia.com.br/tokens/TERRE02',
}

export const MODELO_IPHONE_PADRAO: ModeloIphone = { id: '18-pro', nome: 'iPhone 18 Pro 256 GB', precoBRL: 11999 }

/**
 * Unica fonte de numeros de negocio do portal.
 * Credito em real: planilha simulador_fenynx.xlsx, aba CRÉDITO (taxa 1,4% ao mes, TAC Fenynx 2%, 12 meses, parcela unica).
 * iPhone: regras do app, fenynx-flutter/lib/data/iphone (1,79% ao mes, TAC 5%, 24 meses, precos de 18/09/2026).
 * Gatilhos de LTV: regras do app, credit_terms.dart (entrada ate 50%, chamada de margem 70%, liquidacao 80%, 72 horas).
 * O alerta em 60% e um aviso interno de teste.
 */
export const CASE_FENYNX = {
  ltv: { entrada: 0.5, alerta: 0.6, recomposicao: 0.7, realizacao: 0.8 } satisfies PoliticaLTV,
  opcoesLtvEntrada: [0.25, 0.35, 0.5],
  prazoRecomposicaoHoras: 72,
  credito: { taxaMensal: 0.014, tac: 0.02, meses: 12, valorPadrao: 10000 },
  iphone: {
    taxaMensal: 0.0179,
    tac: 0.05,
    meses: 24,
    modelos: [
      MODELO_IPHONE_PADRAO,
      { id: '18-pro-max', nome: 'iPhone 18 Pro Max 256 GB', precoBRL: 12999 },
    ] satisfies ModeloIphone[],
  },
} as const

export const CASAS_ATIVO: Record<Ativo, number> = { XRP: 2, BTC: 6, MPT: 0 }
