import type { PoliticaLTV } from './credito'

/** CESTA e a operacao garantida por mais de um ativo ao mesmo tempo. */
export type Ativo = 'XRP' | 'BTC' | 'MPT' | 'CESTA'
export type Produto = 'credito' | 'iphone' | 'leasing'

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
  /** Leasing de caminhao. Taxa e TAC ainda nao informadas: ficam em zero ate a Eos Loan passar as condicoes. */
  leasing: { taxaMensal: 0, tac: 0, meses: 11.2 },
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

export const CASAS_ATIVO: Record<Ativo, number> = { XRP: 2, BTC: 6, MPT: 0, CESTA: 0 }

export type ClasseToken = 'veiculo' | 'recebivel' | 'imovel'

export interface TokenRwa {
  /** Ate 6 caracteres, letras maiusculas e digitos, como pede a XLS 89. */
  ticker: string
  nome: string
  descricao: string
  classe: ClasseToken
  /** Subclasse da XLS 89. */
  subclasse: 'other' | 'private_credit' | 'real_estate'
  emissor: string
  /** Unidades emitidas. O caminhao e um bem unico: uma unidade. O recebivel tem uma unidade por real. */
  quantidade: number
  valorUnitario: number
  imagem: string
  info: Record<string, string | number>
}

/**
 * Case Brummel: leasing de caminhao com cesta de tres garantias.
 * Informado pelo Lucas em 01/10/2026: credora Eos Loan, transportadora Brummel, operacao de
 * R$ 90.000, garantias caminhao, recebivel do leasing e R$ 9.000 em XRP (10%).
 * As 48 parcelas semanais vem da reuniao de 30/09/2026.
 * PREMISSAS A CONFIRMAR, por falta de dado: valor do caminhao igual ao credito, recebivel igual ao
 * principal em 48 parcelas sem juros, haircut zero em todas as garantias, modelo e placa do
 * caminhao nao informados.
 */
export const CASE_BRUMMEL = {
  credora: 'Eos Loan',
  tomadora: 'Transportadora Brummel',
  principal: 90000,
  parcelas: 48,
  intervaloDias: 7,
  xrpBRL: 9000,
  haircut: { XRP: 0, veiculo: 0, recebivel: 0 },
  caminhao: {
    ticker: 'BRMC01',
    nome: 'Caminhão Brummel 01',
    descricao: 'Caminhão objeto do leasing, dado em garantia à Eos Loan.',
    classe: 'veiculo',
    subclasse: 'other',
    emissor: 'Transportadora Brummel',
    quantidade: 1,
    valorUnitario: 90000,
    imagem: '/ativos/caminhao.svg',
    info: { tipo: 'veiculo', bem: 'caminhao', credora: 'Eos Loan', valor_brl: 90000, modelo: 'a informar', placa: 'a informar' },
  },
  recebivel: {
    ticker: 'BRMR01',
    nome: 'Recebível do leasing Brummel 01',
    descricao: 'Parcelas semanais do leasing do caminhão, cedidas em garantia à Eos Loan.',
    classe: 'recebivel',
    subclasse: 'private_credit',
    emissor: 'Transportadora Brummel',
    quantidade: 90000,
    valorUnitario: 1,
    imagem: '/ativos/recebivel.svg',
    info: { tipo: 'recebivel', origem: 'leasing de caminhao', credora: 'Eos Loan', parcelas: 48, periodicidade: 'semanal', parcela_brl: 1875 },
  },
} as const satisfies {
  caminhao: TokenRwa
  recebivel: TokenRwa
  [chave: string]: unknown
}

export const TOKENS_BRUMMEL: TokenRwa[] = [CASE_BRUMMEL.caminhao, CASE_BRUMMEL.recebivel]
