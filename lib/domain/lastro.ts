/**
 * Dossie do lastro do token TERRE02 e modelo de score.
 * Fatos lidos em 01/10/2026 das fontes listadas em LASTRO_TERRE02.fontes: lamina, informacoes
 * essenciais e comunicado de inicio e encerramento da oferta na Zuvia, site do empreendimento
 * e anuncio de lote na Concreto Imoveis. Os pesos do score sao um modelo de teste.
 */

export interface EtapaObra {
  chave: 'terraplanagem' | 'drenagem' | 'redeEletrica' | 'aguaEsgoto' | 'pavimentacao'
  avanco: number
}

export const LASTRO_TERRE02 = {
  ticker: 'TERRE02',
  lidoEm: '2026-10-01',
  titulo: {
    emissora: 'Zuvia Securitizadora S.A.',
    cnpjEmissora: '56.157.890/0001-02',
    devedora: 'Blue Ventures Incorporação Ltda',
    plataforma: 'Zuvia Digital Assets',
    tokens: 781250,
    precoUnitario: 1,
    taxaMensal: 0.014,
    inicio: '2026-09-21',
    vencimento: '2027-09-21',
    parcelaMensal: 10937.5,
    totalComRentabilidade: 912500,
    taxaDistribuicao: 87500,
    cronograma: [
      '2026-10-21', '2026-11-23', '2026-12-21', '2027-01-21', '2027-02-22', '2027-03-22',
      '2027-04-21', '2027-05-21', '2027-06-21', '2027-07-21', '2027-08-23', '2027-09-21',
    ],
  },
  empreendimento: {
    nome: 'Terre di Toscana Residencial',
    cidade: 'Bauru, SP',
    endereco: 'Avenida José Affonso Aiello, Vila Serrão',
    areaM2: 125000,
    areaVerdeM2: 40000,
    lotes: 373,
    loteMinimoM2: 320,
    matricula: '121.678',
    cartorio: '1º Cartório de Registro de Imóveis de Bauru',
    alvara: '02/21',
    alvaraData: '2021-04-27',
    entregaPrevista: '2026-03-31',
    obraGeral: 0.91,
    etapas: [
      { chave: 'terraplanagem', avanco: 1 },
      { chave: 'drenagem', avanco: 1 },
      { chave: 'redeEletrica', avanco: 1 },
      { chave: 'aguaEsgoto', avanco: 1 },
      { chave: 'pavimentacao', avanco: 1 },
    ] satisfies EtapaObra[],
    statusLotes: { vendidos: 0.29, reservados: 0.386, estoque: 0.316, usoComum: 0.008 },
  },
  mercado: {
    imobiliaria: 'Concreto Imóveis',
    codigoAnuncio: '103829',
    anuncioUrl: 'https://www.concretoimoveis.com.br/comprar/Bauru/Terreno/Condominio/Vila-Serrao/103829',
    precoReferencia: 370000,
    areaReferenciaM2: 320,
  },
  fontes: [
    { chave: 'oferta', url: 'https://app.zuvia.com.br/tokens/TERRE02' },
    { chave: 'lamina', url: 'https://app.zuvia.com.br/tokens/TERRE02/documento/TMOibWluYSBURVJSRTAy' },
    { chave: 'essenciais', url: 'https://app.zuvia.com.br/tokens/TERRE02/documento/SW5mb3JtYcOnw7VlcyBFc3NlbmNpYWlzIFRFUlJFMDI' },
    {
      chave: 'encerramento',
      url: 'https://app.zuvia.com.br/tokens/TERRE02/documento/SW5mb3JtYcOnw7VlcyBTb2JyZSBvIEluw61jaW8gZSBvIEVuY2VycmFtZW50byBkZSBPZmVydGEgUMO6YmxpY2EgVEVSUkUwMg',
    },
    { chave: 'empreendimento', url: 'https://terreditoscana.com.br/' },
    { chave: 'anuncio', url: 'https://www.concretoimoveis.com.br/comprar/Bauru/Terreno/Condominio/Vila-Serrao/103829' },
  ],
} as const

/** Retrato do lastro em um momento. E o que fica gravado no ledger a cada atestado. */
export interface Atestado {
  ticker: string
  obra: number
  vendidos: number
  reservados: number
  /** Preco do anuncio de referencia em real. Nulo quando o anuncio saiu do ar. */
  precoAnuncio: number | null
  areaAnuncioM2: number | null
  parcelasPagas: number
}

export interface AtestadoGravado extends Atestado {
  em: string
  hash: string
}

export type ChaveScore = 'obra' | 'absorcao' | 'preco' | 'pagamentos' | 'prazo'

export interface ComponenteScore {
  chave: ChaveScore
  peso: number
  /** Entre 0 e 1. */
  nota: number
}

export interface Score {
  total: number
  faixa: 'saudavel' | 'atencao' | 'risco'
  componentes: ComponenteScore[]
}

export const PESOS_SCORE: Record<ChaveScore, number> = {
  obra: 25,
  absorcao: 25,
  preco: 20,
  pagamentos: 20,
  prazo: 10,
}

export function precoPorM2(preco: number | null, area: number | null): number | null {
  return preco && area ? preco / area : null
}

export function parcelasVencidas(agora: number): number {
  return LASTRO_TERRE02.titulo.cronograma.filter((dia) => new Date(`${dia}T23:59:59-03:00`).getTime() <= agora).length
}

/**
 * Score de 0 a 100 do lastro. Obra, absorcao comercial dos lotes, preco de mercado frente a
 * referencia, pagamentos da divida em dia e cumprimento do prazo de entrega.
 */
export function scoreDoLastro(a: Atestado, agora: number): Score {
  const { empreendimento, mercado } = LASTRO_TERRE02
  const referencia = mercado.precoReferencia / mercado.areaReferenciaM2
  const atual = precoPorM2(a.precoAnuncio, a.areaAnuncioM2)
  const vencidas = parcelasVencidas(agora)
  const atrasada = agora > new Date(`${empreendimento.entregaPrevista}T23:59:59-03:00`).getTime() && a.obra < 1
  const notas: Record<ChaveScore, number> = {
    obra: a.obra,
    absorcao: (a.vendidos + a.reservados) / (1 - empreendimento.statusLotes.usoComum),
    // Sem anuncio no ar nao ha preco observavel: nota neutra.
    preco: atual === null ? 0.5 : atual / referencia,
    pagamentos: vencidas === 0 ? 1 : a.parcelasPagas / vencidas,
    prazo: atrasada ? 0 : 1,
  }
  const componentes = (Object.keys(PESOS_SCORE) as ChaveScore[]).map((chave) => ({
    chave,
    peso: PESOS_SCORE[chave],
    nota: Math.max(0, Math.min(1, notas[chave])),
  }))
  const total = Math.round(componentes.reduce((soma, c) => soma + c.peso * c.nota, 0))
  return { total, faixa: total >= 75 ? 'saudavel' : total >= 50 ? 'atencao' : 'risco', componentes }
}

/** Retrato inicial, com os numeros dos documentos da oferta. */
export const ATESTADO_DOCUMENTOS: Atestado = {
  ticker: LASTRO_TERRE02.ticker,
  obra: LASTRO_TERRE02.empreendimento.obraGeral,
  vendidos: LASTRO_TERRE02.empreendimento.statusLotes.vendidos,
  reservados: LASTRO_TERRE02.empreendimento.statusLotes.reservados,
  precoAnuncio: LASTRO_TERRE02.mercado.precoReferencia,
  areaAnuncioM2: LASTRO_TERRE02.mercado.areaReferenciaM2,
  parcelasPagas: 0,
}
