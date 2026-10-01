import { decodeMPTokenMetadata, dropsToXrp, type Client } from 'xrpl'
import {
  montarOperacao,
  type Operacao,
  type Registro,
  type RegistroDatado,
  type SaldosCesta,
} from '../domain/operacao'
import { integracaoConfigurada, listarEmprestimos } from '../fenynx/cliente'
import type { EmprestimoFenynx } from '../fenynx/contrato'
import { enriquecer, operacaoDaApi } from '../fenynx/mapa'
import { cotacaoDeMercado, type FontePreco } from '../precos'
import type { AtestadoGravado } from '../domain/lastro'
import { ORACULO_ID, TIPO_MEMO, TIPO_MEMO_LASTRO } from './devnet'
import type { Contexto } from './servidor'

/** XRP que a Fenynx coloca na conta da operacao para cobrir a reserva do ledger. */
export const RESERVA_OPERACAO_XRP = 3

type Campos = Record<string, unknown>

export type TipoEvento =
  | 'abertura'
  | 'configuracao'
  | 'registro'
  | 'trava'
  | 'atestado'
  | 'liberacao'
  | 'pagamento'
  | 'liquidacao'
  | 'avaliacao'
  | 'outro'

export interface Preco {
  valor: number
  fontes: FontePreco[]
}

export interface Precos {
  XRP: Preco | null
  BTC: Preco | null
  /** Verdadeiro quando ha precos de teste publicados no oraculo do ledger. */
  simulado: boolean
}

export interface Integracao {
  configurada: boolean
  emprestimos: number
  erro: string | null
}

export interface Painel {
  inicializado: boolean
  precos: Precos
  operacoes: Operacao[]
  integracao: Integracao
}

export interface Evento {
  tipo: TipoEvento
  transacao: string
  hash: string
  data: string
  detalhe: string
}

export interface ContaTeste {
  papel: 'FENYNX' | 'AGENTE_GARANTIA' | 'TOMADOR'
  endereco: string
  xrp: number
}

function campos(item: unknown): Campos {
  return item !== null && typeof item === 'object' ? (item as Campos) : {}
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : ''
}

function num(valor: unknown): number {
  if (typeof valor === 'number') return valor
  if (typeof valor === 'string' && valor !== '') return Number(valor)
  return 0
}

function codigoErro(erro: unknown): string {
  return texto(campos(campos(erro).data).error)
}

function deHex(valor: unknown): string {
  return Buffer.from(texto(valor), 'hex').toString('utf8')
}

/** Precos simulados publicados no oraculo, quando existem. */
async function precosSimulados(client: Client, fenynx: string): Promise<{ XRP: number; BTC: number } | null> {
  try {
    const resposta = await client.request({
      command: 'ledger_entry',
      oracle: { account: fenynx, oracle_document_id: ORACULO_ID },
      ledger_index: 'validated',
    })
    const series: unknown[] = (() => {
      const lista = campos(resposta.result.node).PriceDataSeries
      return Array.isArray(lista) ? lista : []
    })()
    const precos: { XRP?: number; BTC?: number } = {}
    for (const item of series) {
      const dado = campos(campos(item).PriceData)
      const bruto = dado.AssetPrice
      const inteiro = typeof bruto === 'string' ? parseInt(bruto, 16) : num(bruto)
      if (dado.BaseAsset === 'XRP' || dado.BaseAsset === 'BTC') {
        precos[dado.BaseAsset] = inteiro / 10 ** num(dado.Scale)
      }
    }
    return precos.XRP && precos.BTC ? { XRP: precos.XRP, BTC: precos.BTC } : null
  } catch (erro) {
    if (['entryNotFound', 'actNotFound'].includes(codigoErro(erro))) return null
    throw erro
  }
}

/** Preco efetivo: simulacao do oraculo quando ativa, senao mercado em tempo real. */
export async function carregarPrecos(client: Client, fenynx: string): Promise<Precos> {
  const simulados = await precosSimulados(client, fenynx)
  if (simulados) {
    const fontes = (valor: number): FontePreco[] => [{ nome: 'XRPL Price Oracle', valor }]
    return {
      XRP: { valor: simulados.XRP, fontes: fontes(simulados.XRP) },
      BTC: { valor: simulados.BTC, fontes: fontes(simulados.BTC) },
      simulado: true,
    }
  }
  const [XRP, BTC] = await Promise.all([cotacaoDeMercado('XRP'), cotacaoDeMercado('BTC')])
  return { XRP, BTC, simulado: false }
}

function registroDe(tx: Campos): Registro | null {
  const memos: unknown[] = Array.isArray(tx.Memos) ? tx.Memos : []
  for (const item of memos) {
    const memo = campos(campos(item).Memo)
    if (deHex(memo.MemoType) !== TIPO_MEMO) continue
    try {
      const dados: unknown = JSON.parse(deHex(memo.MemoData))
      if (typeof campos(dados).t === 'string') return dados as Registro
    } catch {
      return null
    }
  }
  return null
}

function eventoDe(
  tx: Campos,
  registro: Registro | null,
  conta: string,
  fenynx: string,
  ativo: string,
): Pick<Evento, 'tipo' | 'detalhe'> {
  const tipo = texto(tx.TransactionType)
  if (registro?.t === 'abertura') return { tipo: 'registro', detalhe: `${registro.principal.toFixed(2)} BRL` }
  if (registro?.t === 'pagamento') return { tipo: 'pagamento', detalhe: `${registro.valor.toFixed(2)} BRL` }
  if (registro?.t === 'liquidacao') {
    return { tipo: 'liquidacao', detalhe: `${registro.quantidade} ${ativo} · ${registro.valor.toFixed(2)} BRL` }
  }
  if (registro?.t === 'avaliacao') {
    return { tipo: 'avaliacao', detalhe: `${registro.ticker ? `${registro.ticker} ` : ''}${registro.valorUnitario.toFixed(2)} BRL` }
  }
  if (registro?.t === 'garantia') {
    return { tipo: registro.quantidade >= 0 ? 'atestado' : 'liberacao', detalhe: `${Math.abs(registro.quantidade)} BTC` }
  }
  if (tipo === 'Payment') {
    const valor = tx.DeliverMax ?? tx.Amount
    const detalhe =
      typeof valor === 'string'
        ? `${Number(dropsToXrp(valor)).toFixed(2)} XRP`
        : typeof campos(valor).mpt_issuance_id === 'string'
          ? `${texto(campos(valor).value)} ${ativo}`
          : ''
    if (tx.Destination === conta) return { tipo: tx.Account === fenynx ? 'abertura' : 'trava', detalhe }
    return { tipo: 'liberacao', detalhe }
  }
  if (tipo === 'SignerListSet' || tipo === 'AccountSet' || tipo === 'MPTokenAuthorize') {
    return { tipo: 'configuracao', detalhe: '' }
  }
  return { tipo: 'outro', detalhe: '' }
}

/** Le a conta da operacao: registros do credito, garantia em XRP e linha do tempo. */
export async function carregarOperacao(
  { client, c, ledger }: Contexto,
  conta: string,
  precos: Precos,
): Promise<{ operacao: Operacao; eventos: Evento[] } | null> {
  let historico
  let info
  try {
    ;[historico, info] = await Promise.all([
      client.request({ command: 'account_tx', account: conta, ledger_index_min: -1, ledger_index_max: -1, limit: 400 }),
      client.request({ command: 'account_info', account: conta, ledger_index: 'validated' }),
    ])
  } catch (erro) {
    if (['actNotFound', 'actMalformed'].includes(codigoErro(erro))) return null
    throw erro
  }
  const validas = historico.result.transactions.flatMap((item) => {
    const meta = item.meta
    if (typeof meta === 'string' || meta.TransactionResult !== 'tesSUCCESS') return []
    const tx = campos(item.tx_json)
    return [{ tx, registro: registroDe(tx), hash: texto(item.hash), data: texto(campos(item).close_time_iso) }]
  })
  const registros: RegistroDatado[] = validas.flatMap((v) => (v.registro ? [{ ...v.registro, em: v.data }] : []))
  const abertura = registros.find((r) => r.t === 'abertura')
  const simbolo = abertura && abertura.t === 'abertura' ? (abertura.token?.ticker ?? abertura.ativo) : ''
  const eventos: Evento[] = validas.map((v) => ({
    ...eventoDe(v.tx, v.registro, conta, c.FENYNX.address, simbolo),
    transacao: texto(v.tx.TransactionType),
    hash: v.hash,
    data: v.data,
  }))
  const criadaEm = eventos[eventos.length - 1]?.data ?? ''
  const saldoXRP = Number(dropsToXrp(info.result.account_data.Balance))
  if (!abertura || abertura.t !== 'abertura') return null
  const garantiaLedger = abertura.token
    ? await ledger.saldoMPT(conta, abertura.token.emissaoId)
    : Math.max(0, Math.round((saldoXRP - RESERVA_OPERACAO_XRP) * 100) / 100)
  const precoMercado =
    abertura.ativo === 'XRP' || abertura.ativo === 'BTC' ? (precos[abertura.ativo]?.valor ?? null) : null
  // Cesta: saldo real de XRP e de cada token na conta da operacao.
  let saldosCesta: SaldosCesta | undefined
  if (abertura.cesta) {
    const tokens: Record<string, number> = {}
    for (const item of abertura.cesta) {
      if (item.k === 'MPT') tokens[item.emissaoId] = await ledger.saldoMPT(conta, item.emissaoId)
    }
    saldosCesta = {
      xrp: Math.max(0, Math.round((saldoXRP - RESERVA_OPERACAO_XRP) * 100) / 100),
      tokens,
      precoXRP: precos.XRP?.valor ?? null,
    }
  }
  const operacao = montarOperacao(conta, criadaEm, registros.reverse(), garantiaLedger, precoMercado, Date.now(), saldosCesta)
  return operacao ? { operacao, eventos } : null
}

/** As contas de operacao sao as contas criadas por pagamento da Fenynx. */
async function contasDeOperacao(client: Client, fenynx: string): Promise<string[]> {
  const resposta = await client.request({
    command: 'account_tx',
    account: fenynx,
    ledger_index_min: -1,
    ledger_index_max: -1,
    limit: 400,
  })
  const contas: string[] = []
  for (const item of resposta.result.transactions) {
    const tx = campos(item.tx_json)
    if (tx.TransactionType !== 'Payment' || tx.Account !== fenynx) continue
    const meta = item.meta
    if (typeof meta === 'string' || meta.TransactionResult !== 'tesSUCCESS') continue
    const criou = meta.AffectedNodes.some(
      (no) =>
        'CreatedNode' in no &&
        no.CreatedNode.LedgerEntryType === 'AccountRoot' &&
        campos(no.CreatedNode.NewFields).Account === tx.Destination,
    )
    if (criou) contas.push(texto(tx.Destination))
  }
  return contas
}

export async function carregarPainel(ctx: Contexto): Promise<Painel> {
  const fenynx = ctx.c.FENYNX.address
  let contas: string[]
  try {
    contas = await contasDeOperacao(ctx.client, fenynx)
  } catch (erro) {
    if (codigoErro(erro) === 'actNotFound') {
      return {
        inicializado: false,
        precos: { XRP: null, BTC: null, simulado: false },
        operacoes: [],
        integracao: { configurada: integracaoConfigurada(), emprestimos: 0, erro: null },
      }
    }
    throw erro
  }
  const precos = await carregarPrecos(ctx.client, fenynx)
  const lidas = await Promise.all(contas.map((conta) => carregarOperacao(ctx, conta, precos)))
  const doLedger = lidas.flatMap((item) => (item ? [item.operacao] : []))

  // API da Fenynx: enriquece as operacoes do trilho e acrescenta as que so existem la.
  const integracao: Integracao = { configurada: integracaoConfigurada(), emprestimos: 0, erro: null }
  let emprestimos: EmprestimoFenynx[] = []
  try {
    emprestimos = await listarEmprestimos()
    integracao.emprestimos = emprestimos.length
  } catch (erro) {
    integracao.erro = erro instanceof Error ? erro.message : String(erro)
  }
  const porConta = new Map(emprestimos.flatMap((e) => (e.contaXrpl ? [[e.contaXrpl, e] as const] : [])))
  const operacoes = doLedger.map((op) => {
    const e = porConta.get(op.conta)
    return e ? enriquecer(op, e) : op
  })
  const noTrilho = new Set(doLedger.map((op) => op.conta))
  for (const e of emprestimos) {
    if (!e.contaXrpl || !noTrilho.has(e.contaXrpl)) operacoes.push(operacaoDaApi(e, precos[e.ativo]?.valor ?? null))
  }
  return { inicializado: true, precos, operacoes, integracao }
}

export async function carregarContas({ client, c }: Contexto): Promise<ContaTeste[]> {
  const papeis = ['FENYNX', 'AGENTE_GARANTIA', 'TOMADOR'] as const
  return Promise.all(
    papeis.map(async (papel) => {
      const endereco = c[papel].address
      try {
        return { papel, endereco, xrp: await client.getXrpBalance(endereco) }
      } catch {
        return { papel, endereco, xrp: 0 }
      }
    }),
  )
}

export interface StatusAmendment {
  nome: string
  devnet: boolean
  mainnet: boolean
}

const AMENDMENTS = ['PriceOracle', 'MPTokensV1', 'TokenEscrow', 'SingleAssetVault', 'LendingProtocol']

async function amendmentsAtivas(url: string): Promise<Set<string>> {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'feature', params: [{}] }),
    cache: 'no-store',
  })
  const corpo: unknown = await resposta.json()
  const features = campos(campos(campos(corpo).result).features)
  const ativas = new Set<string>()
  for (const item of Object.values(features)) {
    const f = campos(item)
    if (f.enabled === true) ativas.add(texto(f.name))
  }
  return ativas
}

/** Consulta ao vivo o que esta ativo na Devnet e na mainnet. */
export async function carregarAmendments(): Promise<StatusAmendment[]> {
  const [devnet, mainnet] = await Promise.all([
    amendmentsAtivas('https://s.devnet.rippletest.net:51234'),
    amendmentsAtivas('https://xrplcluster.com'),
  ])
  return AMENDMENTS.map((nome) => ({ nome, devnet: devnet.has(nome), mainnet: mainnet.has(nome) }))
}

/** Atestados do lastro gravados pela Fenynx no ledger, do mais recente para o mais antigo. */
export async function carregarAtestados({ client, c }: Contexto, ticker: string): Promise<AtestadoGravado[]> {
  let resposta
  try {
    resposta = await client.request({
      command: 'account_tx',
      account: c.FENYNX.address,
      ledger_index_min: -1,
      ledger_index_max: -1,
      limit: 400,
    })
  } catch (erro) {
    if (codigoErro(erro) === 'actNotFound') return []
    throw erro
  }
  const atestados: AtestadoGravado[] = []
  for (const item of resposta.result.transactions) {
    const meta = item.meta
    if (typeof meta === 'string' || meta.TransactionResult !== 'tesSUCCESS') continue
    const memos: unknown[] = (() => {
      const lista = campos(item.tx_json).Memos
      return Array.isArray(lista) ? lista : []
    })()
    for (const bruto of memos) {
      const memo = campos(campos(bruto).Memo)
      if (deHex(memo.MemoType) !== TIPO_MEMO_LASTRO) continue
      try {
        const d = campos(JSON.parse(deHex(memo.MemoData)))
        if (d.ticker !== ticker) continue
        atestados.push({
          ticker,
          obra: num(d.obra),
          vendidos: num(d.vendidos),
          reservados: num(d.reservados),
          precoAnuncio: typeof d.precoAnuncio === 'number' ? d.precoAnuncio : null,
          areaAnuncioM2: typeof d.areaAnuncioM2 === 'number' ? d.areaAnuncioM2 : null,
          parcelasPagas: num(d.parcelasPagas),
          em: texto(campos(item).close_time_iso),
          hash: texto(item.hash),
        })
      } catch {
        continue
      }
    }
  }
  return atestados
}

export interface EmissaoLedger {
  emissaoId: string
  ticker: string | null
  emitido: number
  maximo: number | null
  /** Metadados XLS 89 como gravados na emissao, com as chaves por extenso. */
  metadados: Record<string, unknown> | null
}

/** Emissoes de MPT da tokenizadora, lidas do ledger com os metadados. */
export async function carregarEmissoes({ client, c }: Contexto): Promise<EmissaoLedger[]> {
  let resposta
  try {
    resposta = await client.request({
      command: 'account_objects',
      account: c.TOKENIZADORA.address,
      ledger_index: 'validated',
      limit: 400,
    })
  } catch (erro) {
    if (codigoErro(erro) === 'actNotFound') return []
    throw erro
  }
  const itens: unknown[] = resposta.result.account_objects
  return itens.map(campos).flatMap((o) => {
    if (o.LedgerEntryType !== 'MPTokenIssuance' || typeof o.mpt_issuance_id !== 'string') return []
    const hex = texto(o.MPTokenMetadata)
    let metadados: Record<string, unknown> | null = null
    try {
      metadados = hex ? campos(decodeMPTokenMetadata(hex)) : null
    } catch {
      metadados = null
    }
    return [
      {
        emissaoId: o.mpt_issuance_id,
        ticker: metadados && typeof metadados.ticker === 'string' ? metadados.ticker : deHex(hex) || null,
        emitido: num(o.OutstandingAmount),
        maximo: o.MaximumAmount === undefined ? null : num(o.MaximumAmount),
        metadados,
      },
    ]
  })
}
