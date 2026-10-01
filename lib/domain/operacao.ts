import { CASE_FENYNX, type Ativo, type ClasseToken, type Produto } from './case'
import { calcularLTV, nivelCobertura, type NivelCobertura } from './credito'

/** Item de uma cesta de garantias, como fica gravado na abertura. h e o haircut, entre 0 e 1. */
export type ItemCestaRegistro =
  | { k: 'XRP'; h: number }
  | { k: 'MPT'; ticker: string; emissaoId: string; valorUnitario: number; classe: ClasseToken; h: number }

/** Uma garantia dentro da cesta, com o valor de hoje. */
export interface ItemGarantia {
  chave: string
  ativo: 'XRP' | 'MPT'
  classe: 'cripto' | ClasseToken
  simbolo: string
  emissaoId: string | null
  quantidade: number
  precoUnitario: number | null
  valorBruto: number
  haircut: number
  /** Valor depois do haircut. E o que entra no LTV. */
  valorElegivel: number
}

/** Saldos reais da conta da operacao, lidos do ledger, para montar a cesta. */
export interface SaldosCesta {
  xrp: number
  tokens: Record<string, number>
  precoXRP: number | null
}

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
      /** Operacao com mais de uma garantia. */
      cesta?: ItemCestaRegistro[]
      credora?: string
      tomadora?: string
      parcelas?: { quantidade: number; intervaloDias: number }
    }
  | { t: 'garantia'; quantidade: number }
  | { t: 'pagamento'; valor: number }
  | { t: 'liquidacao'; quantidade: number; preco: number; valor: number }
  | { t: 'avaliacao'; valorUnitario: number; ticker?: string }

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
  /** Garantias da cesta. Nulo em operacao de garantia unica. */
  itens: ItemGarantia[] | null
  credora: string | null
  tomadora: string | null
  parcelas: { quantidade: number; intervaloDias: number } | null
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

/** Valor de cada garantia da cesta: XRP a preco de mercado, tokens pela ultima avaliacao. */
export function montarCesta(
  cesta: ItemCestaRegistro[],
  saldos: SaldosCesta,
  avaliacoes: Map<string, number>,
): ItemGarantia[] {
  return cesta.map((item) => {
    if (item.k === 'XRP') {
      const valorBruto = saldos.precoXRP === null ? 0 : saldos.xrp * saldos.precoXRP
      return {
        chave: 'XRP',
        ativo: 'XRP',
        classe: 'cripto',
        simbolo: 'XRP',
        emissaoId: null,
        quantidade: saldos.xrp,
        precoUnitario: saldos.precoXRP,
        valorBruto,
        haircut: item.h,
        valorElegivel: valorBruto * (1 - item.h),
      }
    }
    const quantidade = saldos.tokens[item.emissaoId] ?? 0
    const precoUnitario = avaliacoes.get(item.ticker) ?? item.valorUnitario
    const valorBruto = quantidade * precoUnitario
    return {
      chave: item.ticker,
      ativo: 'MPT',
      classe: item.classe,
      simbolo: item.ticker,
      emissaoId: item.emissaoId,
      quantidade,
      precoUnitario,
      valorBruto,
      haircut: item.h,
      valorElegivel: valorBruto * (1 - item.h),
    }
  })
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
  saldosCesta?: SaldosCesta,
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
  const avaliacoes = new Map<string, number>()
  for (const r of registros) {
    if (r.t !== 'avaliacao') continue
    if (r.ticker) avaliacoes.set(r.ticker, r.valorUnitario)
    else avaliacao = r.valorUnitario
  }
  const itens = abertura.cesta && saldosCesta ? montarCesta(abertura.cesta, saldosCesta, avaliacoes) : null
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
  const elegivelCesta = itens ? itens.reduce((soma, i) => soma + i.valorElegivel, 0) : 0
  const garantiaQtd = itens
    ? itens.filter((i) => i.quantidade > 0).length
    : abertura.ativo === 'BTC'
      ? Math.max(0, garantiaBTC)
      : garantiaLedger

  let status: StatusOperacao = 'ativa'
  if (encerrada) status = liquidou ? 'liquidada' : 'quitada'
  else if (garantiaQtd === 0 && !liquidou) status = 'aguardando'

  const monitorada = status === 'ativa' && preco !== null
  const ltv = itens
    ? status === 'ativa' && elegivelCesta > 0
      ? saldoDevedor / elegivelCesta
      : null
    : monitorada
      ? calcularLTV(saldoDevedor, garantiaQtd, preco)
      : null
  // Na cesta nao existe um unico preco de gatilho: a folga e a queda do valor total ate a margem.
  const precoMargem = !itens && garantiaQtd > 0 ? saldoDevedor / (garantiaQtd * CASE_FENYNX.ltv.recomposicao) : null
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
    garantiaBRL: itens ? elegivelCesta : preco === null ? null : garantiaQtd * preco,
    precoAtual: itens ? null : preco,
    folgaMargem: itens
      ? ltv !== null
        ? Math.max(0, 1 - ltv / CASE_FENYNX.ltv.recomposicao)
        : null
      : precoMargem !== null && preco
        ? Math.max(0, 1 - precoMargem / preco)
        : null,
    ltv,
    nivel: ltv === null ? null : nivelCobertura(ltv, CASE_FENYNX.ltv),
    precoMargem,
    precoLiquidacao: !itens && garantiaQtd > 0 ? saldoDevedor / (garantiaQtd * CASE_FENYNX.ltv.realizacao) : null,
    liberavel: !itens && status === 'ativa' ? Math.max(0, garantiaQtd - exigida) : 0,
    status,
    origem: 'ledger',
    itens,
    credora: abertura.credora ?? null,
    tomadora: abertura.tomadora ?? null,
    parcelas: abertura.parcelas ?? null,
    cliente: null,
    fenynx: null,
  }
}
