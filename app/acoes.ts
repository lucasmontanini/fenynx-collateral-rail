'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_SESSAO, credenciaisValidas, criarToken } from '@/lib/auth/sessao'
import { exigirSessao } from '@/lib/auth/servidor'
import { CASAS_ATIVO, type Ativo } from '@/lib/domain/case'
import type { Operacao, Registro } from '@/lib/domain/operacao'
import { LASTRO_TERRE02, type Atestado } from '@/lib/domain/lastro'
import { ErroNegocio } from '@/lib/erros'
import { revelarIdentidade } from '@/lib/fenynx/cliente'
import { lerAnuncio } from '@/lib/lastro/anuncio'
import { COOKIE_IDIOMA } from '@/lib/i18n/servidor'
import { cotacaoDeMercado } from '@/lib/precos'
import type { Resultado } from '@/lib/resultado'
import { carregarOperacao, carregarPrecos } from '@/lib/xrpl/leitura'
import { abrirOperacao, devolverGarantia, entrarGarantia, paraBaixo, paraCima, sairGarantia } from '@/lib/xrpl/operacoes'
import { comLedger, type Contexto } from '@/lib/xrpl/servidor'

function mensagem(erro: unknown): string {
  return erro instanceof Error ? erro.message : String(erro)
}

function valorPositivo(dados: FormData, campo: string): number {
  const valor = Number(String(dados.get(campo) ?? '').replace(',', '.'))
  if (!Number.isFinite(valor) || valor <= 0) throw new ErroNegocio('valor')
  return valor
}

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo)
  if (typeof valor !== 'string' || valor === '') throw new ErroNegocio('valor')
  return valor
}

function centavos(valor: number): number {
  return Math.round(valor * 100) / 100
}

async function executar(fn: (ctx: Contexto) => Promise<void>): Promise<Resultado> {
  await exigirSessao()
  try {
    await comLedger(fn)
  } catch (erro) {
    return { ok: false, erro: mensagem(erro) }
  }
  revalidatePath('/', 'layout')
  return { ok: true, erro: '' }
}

async function lerOperacao(ctx: Contexto, conta: string): Promise<{ op: Operacao; preco: number }> {
  const precos = await carregarPrecos(ctx.client, ctx.c.FENYNX.address)
  const lida = await carregarOperacao(ctx, conta, precos)
  if (!lida) throw new ErroNegocio('semOperacao')
  const preco = lida.operacao.precoAtual ?? (lida.operacao.itens ? 1 : null)
  if (!preco) throw new ErroNegocio('semPreco')
  return { op: lida.operacao, preco }
}

// ------------------------------------------------------------------ sessao

export async function entrar(_: Resultado, dados: FormData): Promise<Resultado> {
  const email = String(dados.get('email') ?? '')
  const senha = String(dados.get('senha') ?? '')
  if (!credenciaisValidas(email, senha)) return { ok: false, erro: 'credenciais' }
  const { token, maxAge } = criarToken(email.trim().toLowerCase())
  ;(await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
  redirect('/')
}

export async function sair(): Promise<void> {
  ;(await cookies()).delete(COOKIE_SESSAO)
  redirect('/login')
}

export async function definirIdioma(dados: FormData): Promise<void> {
  const idioma = dados.get('idioma') === 'en' ? 'en' : 'pt'
  ;(await cookies()).set(COOKIE_IDIOMA, idioma, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  revalidatePath('/', 'layout')
}

// ---------------------------------------------------------------- ambiente

export async function inicializarAmbiente(_: Resultado, __: FormData): Promise<Resultado> {
  return executar(async ({ ledger }) => {
    await ledger.garantirXRP('FENYNX', 50)
    await ledger.garantirXRP('AGENTE_GARANTIA', 20)
    await ledger.garantirXRP('TOMADOR', 50)
  })
}

/** Publica precos de teste no oraculo. Campo vazio usa o preco de mercado do momento. */
export async function simularPrecos(_: Resultado, dados: FormData): Promise<Resultado> {
  return executar(async ({ ledger }) => {
    const ler = async (ativo: 'XRP' | 'BTC'): Promise<number> => {
      if (String(dados.get(ativo) ?? '') !== '') return valorPositivo(dados, ativo)
      const mercado = await cotacaoDeMercado(ativo)
      if (!mercado) throw new ErroNegocio('semPreco')
      return mercado.valor
    }
    await ledger.simularPrecos({ XRP: await ler('XRP'), BTC: await ler('BTC') })
  })
}

export async function voltarAoMercado(_: Resultado, __: FormData): Promise<Resultado> {
  return executar(async ({ ledger }) => {
    await ledger.removerSimulacao()
  })
}

// --------------------------------------------------------------- operacoes

export async function criarOperacao(_: Resultado, dados: FormData): Promise<Resultado> {
  await exigirSessao()
  let conta = ''
  try {
    const ativo = dados.get('ativo')
    conta = await comLedger((ctx) =>
      abrirOperacao(ctx, {
        produto: dados.get('produto') === 'iphone' ? 'iphone' : 'credito',
        ativo: ativo === 'BTC' || ativo === 'MPT' ? ativo : 'XRP',
        ltvEntrada: Number(dados.get('ltv')),
        principal: Number(String(dados.get('principal') ?? '').replace(',', '.')),
        modeloId: String(dados.get('modelo') ?? ''),
      }),
    )
  } catch (erro) {
    return { ok: false, erro: mensagem(erro) }
  }
  revalidatePath('/', 'layout')
  redirect(`/operacoes/${conta}`)
}

export async function registrarPagamento(_: Resultado, dados: FormData): Promise<Resultado> {
  return executar(async (ctx) => {
    const { op } = await lerOperacao(ctx, texto(dados, 'conta'))
    if (op.saldoDevedor === 0) throw new ErroNegocio('semDivida')
    const quitar = dados.get('quitar') === 'sim'
    const valor = quitar ? centavos(op.saldoDevedor + 0.005) : valorPositivo(dados, 'valor')
    if (valor > op.saldoDevedor + 0.01) throw new ErroNegocio('acimaDoSaldo')
    await ctx.ledger.registrar(op.conta, { t: 'pagamento', valor } satisfies Registro)
    // Na cesta, a parcela paga da baixa no recebivel: os tokens voltam ao emissor.
    const recebivel = op.itens?.find((i) => i.classe === 'recebivel')
    if (recebivel?.emissaoId) {
      const baixa = Math.min(recebivel.quantidade, Math.floor(valor / (recebivel.precoUnitario ?? 1)))
      if (baixa > 0) await ctx.ledger.moverToken(op.conta, 'TOKENIZADORA', recebivel.emissaoId, baixa)
    }
    if (valor >= op.saldoDevedor - 0.01) await devolverGarantia(ctx, op, op.garantiaQtd)
  })
}

export async function reforcarGarantia(_: Resultado, dados: FormData): Promise<Resultado> {
  return executar(async (ctx) => {
    const { op } = await lerOperacao(ctx, texto(dados, 'conta'))
    // Na cesta o reforco entra em XRP.
    const alvo = op.ativo === 'CESTA' ? { ...op, ativo: 'XRP' as const } : op
    const quantidade = paraBaixo(valorPositivo(dados, 'quantidade'), CASAS_ATIVO[alvo.ativo])
    if (quantidade <= 0) throw new ErroNegocio('valor')
    await entrarGarantia(ctx, alvo, quantidade)
  })
}

export async function liberarExcedente(_: Resultado, dados: FormData): Promise<Resultado> {
  return executar(async (ctx) => {
    const { op } = await lerOperacao(ctx, texto(dados, 'conta'))
    const quantidade = paraBaixo(op.liberavel, CASAS_ATIVO[op.ativo])
    if (quantidade <= 0) throw new ErroNegocio('semExcedente')
    await sairGarantia(ctx, op, 'TOMADOR', quantidade)
  })
}

/**
 * Realizacao da garantia. A quantidade necessaria sai da conta da operacao para a tesouraria
 * da Fenynx, que executa a venda fora do ledger. Para BTC a venda acontece no custodiante e
 * o ledger guarda o registro. A sobra volta ao cliente.
 */
export async function liquidarGarantia(_: Resultado, dados: FormData): Promise<Resultado> {
  return executar(async (ctx) => {
    const { op, preco } = await lerOperacao(ctx, texto(dados, 'conta'))
    if (op.ativo === 'CESTA') throw new ErroNegocio('cestaManual')
    if (op.nivel !== 'realizacao') throw new ErroNegocio('ltvLiquidacao')
    const quantidade = Math.min(op.garantiaQtd, paraCima(op.saldoDevedor / preco, CASAS_ATIVO[op.ativo]))
    const valor = centavos(Math.min(op.saldoDevedor + 0.005, quantidade * preco))
    await sairGarantia(ctx, op, 'FENYNX', quantidade, { t: 'liquidacao', quantidade, preco: centavos(preco), valor })
    if (valor >= op.saldoDevedor - 0.01) await devolverGarantia(ctx, op, op.garantiaQtd - quantidade)
  })
}

/** Nova avaliacao do token em garantia. Vale para tokens, que nao tem preco de mercado. */
export async function reavaliarGarantia(_: Resultado, dados: FormData): Promise<Resultado> {
  return executar(async (ctx) => {
    const { op } = await lerOperacao(ctx, texto(dados, 'conta'))
    const valorUnitario = valorPositivo(dados, 'valorUnitario')
    if (op.ativo === 'CESTA') {
      const ticker = texto(dados, 'ticker')
      if (!op.itens?.some((i) => i.chave === ticker && i.ativo === 'MPT')) throw new ErroNegocio('valor')
      await ctx.ledger.registrar(op.conta, { t: 'avaliacao', valorUnitario, ticker } satisfies Registro)
      return
    }
    if (op.ativo !== 'MPT') throw new ErroNegocio('valor')
    await ctx.ledger.registrar(op.conta, { t: 'avaliacao', valorUnitario } satisfies Registro)
  })
}

// ------------------------------------------------------------------ lastro

function fracao(dados: FormData, campo: string): number {
  const valor = Number(String(dados.get(campo) ?? '').replace(',', '.'))
  if (!Number.isFinite(valor) || valor < 0 || valor > 100) throw new ErroNegocio('valor')
  return Math.round(valor * 10) / 1000
}

/**
 * Atestado do lastro. Junta o que a equipe apurou fora do ledger com o preco do anuncio lido
 * na hora e grava o retrato no ledger, assinado pela Fenynx.
 */
export async function registrarAtestado(_: Resultado, dados: FormData): Promise<Resultado> {
  return executar(async ({ ledger }) => {
    const anuncio = await lerAnuncio()
    const atestado: Atestado = {
      ticker: LASTRO_TERRE02.ticker,
      obra: fracao(dados, 'obra'),
      vendidos: fracao(dados, 'vendidos'),
      reservados: fracao(dados, 'reservados'),
      precoAnuncio: anuncio?.preco ?? null,
      areaAnuncioM2: anuncio?.areaM2 ?? null,
      parcelasPagas: Math.max(0, Math.round(Number(dados.get('parcelasPagas') ?? 0))),
    }
    if (atestado.vendidos + atestado.reservados > 1) throw new ErroNegocio('valor')
    await ledger.registrarAtestado(atestado)
  })
}

// ----------------------------------------------------------------- cliente

export type ResultadoIdentidade = { ok: boolean; erro: string; nome?: string; documento?: string } | null

/** Consulta o nome do tomador na Fenynx. Exige sessao e deixa registro de auditoria. */
export async function revelarCliente(_: ResultadoIdentidade, dados: FormData): Promise<ResultadoIdentidade> {
  const solicitante = await exigirSessao()
  try {
    const identidade = await revelarIdentidade(texto(dados, 'emprestimo'), solicitante)
    return { ok: true, erro: '', nome: identidade.nome, documento: identidade.documentoMascarado }
  } catch (erro) {
    return { ok: false, erro: mensagem(erro) }
  }
}
