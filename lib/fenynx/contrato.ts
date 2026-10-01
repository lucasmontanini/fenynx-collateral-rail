import type { Ativo, Produto } from '../domain/case'
import type { StatusOperacao } from '../domain/operacao'

/**
 * Contrato esperado da API da Fenynx. E uma proposta: ajustar quando a documentacao real chegar.
 * Tudo o que o portal precisa da API passa por este arquivo e por cliente.ts.
 *
 * GET  {FENYNX_API_URL}/v1/emprestimos        -> { items: EmprestimoApi[] }
 * GET  {FENYNX_API_URL}/v1/emprestimos/{id}   -> EmprestimoApi
 * Autenticacao: Authorization: Bearer {FENYNX_API_KEY}
 */
export interface EmprestimoApi {
  id: string
  produto: Produto
  ativo: Exclude<Ativo, 'MPT'>
  modelo?: string
  garantia_quantidade: number
  principal_brl: number
  tac_brl: number
  taxa_mensal: number
  prazo_meses: number
  saldo_devedor_brl: number
  /** LTV calculado pela Fenynx, entre 0 e 1. */
  ltv: number
  status: StatusOperacao
  iniciado_em: string
  /** Conta da operacao na XRPL, quando a garantia esta no trilho. */
  conta_xrpl?: string
  tomador: TomadorApi
}

/** Dado pessoal. So existe dentro de cliente.ts e sai dali como codigo. */
export interface TomadorApi {
  id: string
  nome: string
  documento: string
}

/** O que o resto do portal enxerga de um emprestimo vindo da API. Sem dado pessoal. */
export interface EmprestimoFenynx {
  id: string
  produto: Produto
  ativo: Exclude<Ativo, 'MPT'>
  modelo: string | null
  garantiaQtd: number
  principal: number
  tac: number
  taxaMensal: number
  meses: number
  saldoDevedor: number
  ltv: number
  status: StatusOperacao
  iniciadoEm: string
  contaXrpl: string | null
  /** Codigo do cliente. Nunca o nome. */
  cliente: string
}

/** Identidade revelada sob demanda, com registro de auditoria. */
export interface IdentidadeRevelada {
  cliente: string
  nome: string
  documentoMascarado: string
}
