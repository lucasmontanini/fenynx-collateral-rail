import { CASE_FENYNX, type Ativo, type Produto } from './case'
import { calcularLTV, nivelCobertura, type NivelCobertura } from './credito'

/** Registros gravados como memo na conta da operacao. O credito em si acontece fora do ledger. */
export type Registro =
  | {
      t: 'abertura'
      produto: Produto
      ativo: Ativo
      principal: number
      tac: number
      taxaMensal: number
      meses: number
      ltvEntrada: number
      modelo?: string
      /** Garantia em token MPT: ticker, emissao no ledger e valor de referencia na abertura. */
      token?: { ticker: string; emissaoId: string; valorUnitario: number }
    }
  | { t: 'garantia'; quantidade: number }
  | { t: 'pagamento'; valor: number }
  | { t: 'liquidacao'; quantidade: number; preco: number; valor: number }
  | { t: 'avaliacao'; valorUnitario: number }

/** Registro com o horario da transacao que o gravou, em ISO. */
export type RegistroDatado = Registro & { em: string }

export type StatusOperacao = 'aguardando' | 'ativa' | 'quitada' | 'liquidada'

export interface Operacao {
  conta: string
  criadaEm: string
  produto: Produto
  ativo: Ativo
  /** XRP, BTC ou o ticker do token. */
  simbolo: string
  emissaoId: string | null
  modelo: string | null
  principal: number
  tac: number
  financiado: number
  taxaMensal: number
  meses: number
  vencimento: string
  totalNoVencimento: number
  pago: number
  saldoDevedor: number
  garantiaQtd: number
  garantiaBRL: number | null
  precoAtual: number | null
  /** Queda de preco que leva a operacao a chamada de margem. Entre 0 e 1. */
  folgaMargem: number | null
  ltv: number | null
  nivel: NivelCobertura | null
  precoMargem: number | null
  precoLiquidacao: number | null
  liberavel: number
  status: StatusOperacao
  /** ledger: conta no trilho. api: emprestimo que so existe na API da Fenynx. */
  origem: 'ledger' | 'api'
  /** Codigo do cliente, vindo da API da Fenynx. Nunca o nome. */
  cliente: string | null
  /** O que a Fenynx informa para o mesmo emprestimo, para conferencia. */
  fenynx: { id: string; ltv: number; saldoDevedor: number } | null
}

const DIA_MS = 86_400_000

export function financiar(principal: number, taxaTac: number): { tac: number; financiado: number } {
  const tac = Math.round(principal * taxaTac * 100) / 100
  return { tac, financiado: principal + tac }
}

export function totalNoPrazo(financiado: number, taxaMensal: number, meses: number): number {
  return financiado * (1 + taxaMensal) ** meses
}

/** Quantidade de garantia exigida para o LTV de entrada escolhido. */
export function garantiaNecessaria(financiado: number, preco: number, ltvEntrada: number): number {
  return financiado / (preco * ltvEntrada)
}

/**
 * Estado da operacao a partir dos registros e do saldo de garantia.
 * garantiaLedger e o saldo real da conta no ledger, em XRP ou em tokens MPT.
 * Para BTC a quantidade vem dos registros. Para MPT o preco vem da ultima avaliacao registrada.
 */
export function montarOperacao(
  conta: string,
  criadaEm: string,
  registros: RegistroDatado[],
  garantiaLedger: number,
  precoMercado: number | null,
  agora: number,
): Operacao | null {
  const abertura = registros.find((r) => r.t === 'abertura')
  if (!abertura || abertura.t !== 'abertura') return null
  const financiado = abertura.principal + abertura.tac
  const inicio = new Date(criadaEm).getTime()
  // Juros correm entre um registro e o seguinte. Quando o saldo zera a operacao encerra e para de correr.
  const juros = (saldo: number, de: number, ate: number): number =>
    saldo * (1 + abertura.taxaMensal) ** (Math.max(0, ate - de) / (30 * DIA_MS))
  let saldo = financiado
  let cursor = inicio
  let encerrada = false
  let pago = 0
  let garantiaBTC = 0
  let liquidou = false
  let avaliacao = abertura.token?.valorUnitario ?? null
  for (const r of registros) {
    if (r.t === 'avaliacao') avaliacao = r.valorUnitario
  }
  const preco = abertura.ativo === 'MPT' ? avaliacao : precoMercado
  for (const r of registros) {
    if (r.t === 'garantia') garantiaBTC += r.quantidade
    if (r.t !== 'pagamento' && r.t !== 'liquidacao') continue
    const quando = new Date(r.em).getTime()
    saldo = juros(saldo, cursor, quando) - r.valor
    cursor = quando
    pago += r.valor
    if (r.t === 'liquidacao') liquidou = true
    if (saldo < 0.05) {
      saldo = 0
      encerrada = true
      break
    }
  }
  const saldoDevedor = encerrada ? 0 : juros(saldo, cursor, agora)
  const garantiaQtd = abertura.ativo === 'BTC' ? Math.max(0, garantiaBTC) : garantiaLedger

  let status: StatusOperacao = 'ativa'
  if (encerrada) status = liquidou ? 'liquidada' : 'quitada'
  else if (garantiaQtd === 0 && !liquidou) status = 'aguardando'

  const monitorada = status === 'ativa' && preco !== null
  const ltv = monitorada ? calcularLTV(saldoDevedor, garantiaQtd, preco) : null
  const precoMargem = garantiaQtd > 0 ? saldoDevedor / (garantiaQtd * CASE_FENYNX.ltv.recomposicao) : null
  const exigida = preco ? saldoDevedor / (preco * CASE_FENYNX.ltv.entrada) : garantiaQtd
  return {
    conta,
    criadaEm,
    produto: abertura.produto,
    ativo: abertura.ativo,
    simbolo: abertura.token?.ticker ?? abertura.ativo,
    emissaoId: abertura.token?.emissaoId ?? null,
    modelo: abertura.modelo ?? null,
    principal: abertura.principal,
    tac: abertura.tac,
    financiado,
    taxaMensal: abertura.taxaMensal,
    meses: abertura.meses,
    vencimento: new Date(inicio + abertura.meses * 30 * DIA_MS).toISOString(),
    totalNoVencimento: totalNoPrazo(financiado, abertura.taxaMensal, abertura.meses),
    pago,
    saldoDevedor,
    garantiaQtd,
    garantiaBRL: preco === null ? null : garantiaQtd * preco,
    precoAtual: preco,
    folgaMargem: precoMargem !== null && preco ? Math.max(0, 1 - precoMargem / preco) : null,
    ltv,
    nivel: ltv === null ? null : nivelCobertura(ltv, CASE_FENYNX.ltv),
    precoMargem,
    precoLiquidacao: garantiaQtd > 0 ? saldoDevedor / (garantiaQtd * CASE_FENYNX.ltv.realizacao) : null,
    liberavel: status === 'ativa' ? Math.max(0, garantiaQtd - exigida) : 0,
    status,
    origem: 'ledger',
    cliente: null,
    fenynx: null,
  }
}
