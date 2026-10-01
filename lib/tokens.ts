import { CASE_BRUMMEL, TOKEN_TERRE02, type ClasseToken } from './domain/case'

export interface TokenCatalogo {
  ticker: string
  nome: string
  descricao: string
  classe: ClasseToken
  emissor: string
  valorUnitario: number
  imagem: string | null
  /** Pagina com o monitoramento do lastro, quando existe. */
  lastro: string | null
}

/** Tokens RWA que o portal conhece. O que esta no ledger e lido a parte e cruzado pelo ticker. */
export const CATALOGO_TOKENS: TokenCatalogo[] = [
  ...[CASE_BRUMMEL.caminhao, CASE_BRUMMEL.recebivel].map((t) => ({
    ticker: t.ticker,
    nome: t.nome,
    descricao: t.descricao,
    classe: t.classe as ClasseToken,
    emissor: t.emissor,
    valorUnitario: t.valorUnitario,
    imagem: t.imagem,
    lastro: null,
  })),
  {
    ticker: TOKEN_TERRE02.ticker,
    nome: 'Dívida imobiliária Terre di Toscana',
    descricao: 'Token de dívida com lastro imobiliário, distribuído pela Zuvia.',
    classe: 'imovel',
    emissor: TOKEN_TERRE02.emissor,
    valorUnitario: TOKEN_TERRE02.valorUnitario,
    imagem: null,
    lastro: '/lastro',
  },
]
