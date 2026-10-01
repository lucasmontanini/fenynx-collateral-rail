import { CASAS_ATIVO, CASE_FENYNX, TOKEN_TERRE02, type Ativo, type Produto } from '../domain/case'
import { financiar, garantiaNecessaria, type Operacao, type Registro } from '../domain/operacao'
import { ErroNegocio } from '../erros'
import { RESERVA_OPERACAO_XRP, carregarPrecos } from './leitura'
import type { Contexto } from './servidor'

export interface PedidoOperacao {
  produto: Produto
  ativo: Ativo
  ltvEntrada: number
  /** Valor do credito em real. Ignorado no iPhone, que usa o preco do modelo. */
  principal?: number
  modeloId?: string
}

type Garantia = Pick<Operacao, 'conta' | 'ativo' | 'emissaoId'>

export function paraCima(valor: number, casas: number): number {
  const fator = 10 ** casas
  return Math.ceil(valor * fator - 1e-9) / fator
}

export function paraBaixo(valor: number, casas: number): number {
  const fator = 10 ** casas
  return Math.floor(valor * fator + 1e-9) / fator
}

function emissao(op: Garantia): string {
  if (!op.emissaoId) throw new ErroNegocio('semOperacao')
  return op.emissaoId
}

/** Entrada de garantia. XRP e token sao travados no ledger. Bitcoin e atestado por registro. */
export async function entrarGarantia(ctx: Contexto, op: Garantia, quantidade: number): Promise<void> {
  if (op.ativo === 'XRP') {
    await ctx.ledger.garantirXRP('TOMADOR', quantidade + 10)
    await ctx.ledger.travarColateralXRP(op.conta, quantidade.toFixed(6))
  } else if (op.ativo === 'MPT') {
    // Apoio de teste: o cliente recebe os tokens da tokenizadora antes de travar.
    await ctx.ledger.entregarToken(emissao(op), quantidade)
    await ctx.ledger.travarToken(op.conta, emissao(op), quantidade)
  } else {
    await ctx.ledger.registrar(op.conta, { t: 'garantia', quantidade } satisfies Registro)
  }
}

/** Saida de garantia com assinatura dupla, para o cliente ou para a tesouraria da Fenynx. */
export async function sairGarantia(
  ctx: Contexto,
  op: Garantia,
  destino: 'TOMADOR' | 'FENYNX',
  quantidade: number,
  registro?: Registro,
): Promise<void> {
  if (op.ativo === 'XRP') {
    await ctx.ledger.moverGarantiaXRP(op.conta, ctx.c[destino].address, quantidade.toFixed(6), registro)
  } else if (op.ativo === 'MPT') {
    await ctx.ledger.moverToken(op.conta, destino, emissao(op), quantidade, registro)
  } else {
    if (registro) await ctx.ledger.registrar(op.conta, registro)
    await ctx.ledger.registrar(op.conta, { t: 'garantia', quantidade: -quantidade } satisfies Registro)
  }
}

/** Devolve ao cliente toda a garantia que resta. restanteBTC informa o saldo atestado em Bitcoin. */
export async function devolverGarantia(ctx: Contexto, op: Garantia, restanteBTC: number): Promise<void> {
  if (op.ativo === 'XRP') {
    const garantia = await ctx.ledger.estadoGarantia(op.conta)
    const xrp = garantia.saldoXRP - RESERVA_OPERACAO_XRP
    if (xrp > 0.000001) await sairGarantia(ctx, op, 'TOMADOR', xrp)
  } else if (op.ativo === 'MPT') {
    const tokens = await ctx.ledger.saldoMPT(op.conta, emissao(op))
    if (tokens > 0) await sairGarantia(ctx, op, 'TOMADOR', tokens)
  } else if (restanteBTC > 0) {
    await sairGarantia(ctx, op, 'TOMADOR', restanteBTC)
  }
}

/** Abre a conta, registra o credito e trava a garantia exigida pelo LTV de entrada. Devolve a conta. */
export async function abrirOperacao(ctx: Contexto, pedido: PedidoOperacao): Promise<string> {
  if (!CASE_FENYNX.opcoesLtvEntrada.some((o) => o === pedido.ltvEntrada)) throw new ErroNegocio('valor')
  const modelo = CASE_FENYNX.iphone.modelos.find((m) => m.id === pedido.modeloId)
  if (pedido.produto === 'iphone' && !modelo) throw new ErroNegocio('valor')
  const regras = CASE_FENYNX[pedido.produto]
  const principal = pedido.produto === 'iphone' && modelo ? modelo.precoBRL : (pedido.principal ?? 0)
  if (!Number.isFinite(principal) || principal <= 0) throw new ErroNegocio('valor')

  let token: { ticker: string; emissaoId: string; valorUnitario: number } | undefined
  let preco: number | undefined
  if (pedido.ativo === 'MPT') {
    await ctx.ledger.garantirXRP('TOKENIZADORA', 10)
    token = {
      ticker: TOKEN_TERRE02.ticker,
      emissaoId: await ctx.ledger.emissaoDoToken(TOKEN_TERRE02.ticker),
      valorUnitario: TOKEN_TERRE02.valorUnitario,
    }
    preco = token.valorUnitario
  } else {
    preco = (await carregarPrecos(ctx.client, ctx.c.FENYNX.address))[pedido.ativo]?.valor
  }
  if (!preco) throw new ErroNegocio('semPreco')

  const { tac, financiado } = financiar(principal, regras.tac)
  const quantidade = paraCima(garantiaNecessaria(financiado, preco, pedido.ltvEntrada), CASAS_ATIVO[pedido.ativo])
  await ctx.ledger.garantirXRP('FENYNX', 10)
  const { conta } = await ctx.ledger.abrirContaGarantia()
  await ctx.ledger.registrar(conta, {
    t: 'abertura',
    produto: pedido.produto,
    ativo: pedido.ativo,
    principal,
    tac,
    taxaMensal: regras.taxaMensal,
    meses: regras.meses,
    ltvEntrada: pedido.ltvEntrada,
    ...(modelo && pedido.produto === 'iphone' ? { modelo: modelo.nome } : {}),
    ...(token ? { token } : {}),
  } satisfies Registro)
  await entrarGarantia(ctx, { conta, ativo: pedido.ativo, emissaoId: token?.emissaoId ?? null }, quantidade)
  return conta
}
