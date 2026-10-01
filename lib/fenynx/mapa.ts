import { CASE_FENYNX } from '../domain/case'
import { calcularLTV, nivelCobertura } from '../domain/credito'
import { totalNoPrazo, type Operacao } from '../domain/operacao'
import type { EmprestimoFenynx } from './contrato'

const DIA_MS = 86_400_000

/** Junta ao que o ledger mostra o que a Fenynx informa: cliente, LTV e saldo dela. */
export function enriquecer(op: Operacao, e: EmprestimoFenynx): Operacao {
  return { ...op, cliente: e.cliente, fenynx: { id: e.id, ltv: e.ltv, saldoDevedor: e.saldoDevedor } }
}

/** Emprestimo que so existe na API vira uma operacao monitorada, com a garantia a preco de mercado. */
export function operacaoDaApi(e: EmprestimoFenynx, preco: number | null): Operacao {
  const financiado = e.principal + e.tac
  const ativa = e.status === 'ativa'
  const ltv = ativa && preco ? calcularLTV(e.saldoDevedor, e.garantiaQtd, preco) : null
  const precoMargem = e.garantiaQtd > 0 ? e.saldoDevedor / (e.garantiaQtd * CASE_FENYNX.ltv.recomposicao) : null
  const exigida = preco ? e.saldoDevedor / (preco * CASE_FENYNX.ltv.entrada) : e.garantiaQtd
  return {
    conta: `api:${e.id}`,
    criadaEm: e.iniciadoEm,
    produto: e.produto,
    ativo: e.ativo,
    simbolo: e.ativo,
    emissaoId: null,
    modelo: e.modelo,
    principal: e.principal,
    tac: e.tac,
    financiado,
    taxaMensal: e.taxaMensal,
    meses: e.meses,
    vencimento: new Date(new Date(e.iniciadoEm).getTime() + e.meses * 30 * DIA_MS).toISOString(),
    totalNoVencimento: totalNoPrazo(financiado, e.taxaMensal, e.meses),
    pago: 0,
    saldoDevedor: e.saldoDevedor,
    garantiaQtd: e.garantiaQtd,
    garantiaBRL: preco === null ? null : e.garantiaQtd * preco,
    precoAtual: preco,
    folgaMargem: precoMargem !== null && preco ? Math.max(0, 1 - precoMargem / preco) : null,
    ltv,
    nivel: ltv === null ? null : nivelCobertura(ltv, CASE_FENYNX.ltv),
    precoMargem,
    precoLiquidacao: e.garantiaQtd > 0 ? e.saldoDevedor / (e.garantiaQtd * CASE_FENYNX.ltv.realizacao) : null,
    liberavel: ativa ? Math.max(0, e.garantiaQtd - exigida) : 0,
    status: e.status,
    origem: 'api',
    cliente: e.cliente,
    fenynx: { id: e.id, ltv: e.ltv, saldoDevedor: e.saldoDevedor },
  }
}
