import { CASE_FENYNX, type Ativo, type Produto } from './case'
import { nivelCobertura, type NivelCobertura } from './credito'
import type { Operacao } from './operacao'

export interface ResumoCarteira {
  ativas: number
  garantiaBRL: number
  dividaBRL: number
  ltv: number | null
  foraDoSaudavel: number
  /** Juros e TAC contratados ate o vencimento das operacoes ativas. */
  receitaPrevista: number
  /** Operacao mais perto da chamada de margem. */
  menorFolga: { conta: string; folga: number } | null
  proximoVencimento: string | null
  porNivel: Record<NivelCobertura, { operacoes: number; dividaBRL: number }>
  porAtivo: { simbolo: string; ativo: Ativo; garantiaBRL: number; operacoes: number }[]
  porProduto: { produto: Produto; dividaBRL: number; operacoes: number }[]
}

export interface PontoEstresse {
  queda: number
  ltv: number
  emMargem: number
  emLiquidacao: number
}

const NIVEIS: NivelCobertura[] = ['entrada', 'alerta', 'recomposicao', 'realizacao']

function soAtivas(operacoes: Operacao[]): Operacao[] {
  return operacoes.filter((o) => o.status === 'ativa')
}

export function resumirCarteira(operacoes: Operacao[]): ResumoCarteira {
  const ativas = soAtivas(operacoes)
  const garantiaBRL = ativas.reduce((soma, o) => soma + (o.garantiaBRL ?? 0), 0)
  const dividaBRL = ativas.reduce((soma, o) => soma + o.saldoDevedor, 0)
  const porNivel = Object.fromEntries(NIVEIS.map((n) => [n, { operacoes: 0, dividaBRL: 0 }])) as ResumoCarteira['porNivel']
  const ativos = new Map<string, ResumoCarteira['porAtivo'][number]>()
  const produtos = new Map<Produto, ResumoCarteira['porProduto'][number]>()
  let menorFolga: ResumoCarteira['menorFolga'] = null
  for (const o of ativas) {
    if (o.nivel) {
      porNivel[o.nivel].operacoes += 1
      porNivel[o.nivel].dividaBRL += o.saldoDevedor
    }
    const a = ativos.get(o.simbolo) ?? { simbolo: o.simbolo, ativo: o.ativo, garantiaBRL: 0, operacoes: 0 }
    a.garantiaBRL += o.garantiaBRL ?? 0
    a.operacoes += 1
    ativos.set(o.simbolo, a)
    const p = produtos.get(o.produto) ?? { produto: o.produto, dividaBRL: 0, operacoes: 0 }
    p.dividaBRL += o.saldoDevedor
    p.operacoes += 1
    produtos.set(o.produto, p)
    if (o.folgaMargem !== null && (menorFolga === null || o.folgaMargem < menorFolga.folga)) {
      menorFolga = { conta: o.conta, folga: o.folgaMargem }
    }
  }
  const vencimentos = ativas.map((o) => o.vencimento).sort()
  return {
    ativas: ativas.length,
    garantiaBRL,
    dividaBRL,
    ltv: garantiaBRL > 0 ? dividaBRL / garantiaBRL : null,
    foraDoSaudavel: ativas.filter((o) => o.nivel !== null && o.nivel !== 'entrada').length,
    receitaPrevista: ativas.reduce((soma, o) => soma + (o.totalNoVencimento - o.principal), 0),
    menorFolga,
    proximoVencimento: vencimentos[0] ?? null,
    porNivel,
    porAtivo: [...ativos.values()].sort((x, y) => y.garantiaBRL - x.garantiaBRL),
    porProduto: [...produtos.values()].sort((x, y) => y.dividaBRL - x.dividaBRL),
  }
}

/**
 * LTV da carteira para cada queda de preco dos criptoativos, de 0 a 60 por cento.
 * Tokens MPT nao tem preco de mercado e ficam fora do choque.
 */
export function curvaDeEstresse(operacoes: Operacao[]): PontoEstresse[] {
  const ativas = soAtivas(operacoes).filter((o) => o.garantiaBRL !== null && o.garantiaBRL > 0)
  const pontos: PontoEstresse[] = []
  for (let passo = 0; passo <= 12; passo += 1) {
    const queda = passo * 0.05
    let garantia = 0
    let divida = 0
    let emMargem = 0
    let emLiquidacao = 0
    for (const o of ativas) {
      const valor = (o.garantiaBRL ?? 0) * (o.ativo === 'MPT' ? 1 : 1 - queda)
      garantia += valor
      divida += o.saldoDevedor
      const nivel = nivelCobertura(o.saldoDevedor / valor, CASE_FENYNX.ltv)
      if (nivel === 'recomposicao') emMargem += 1
      if (nivel === 'realizacao') emLiquidacao += 1
    }
    pontos.push({ queda, ltv: garantia > 0 ? divida / garantia : 0, emMargem, emLiquidacao })
  }
  return pontos
}
