import { mascararDocumento, pseudonimo } from '../privacidade/pseudonimo'
import type { EmprestimoApi, EmprestimoFenynx, IdentidadeRevelada } from './contrato'

export function integracaoConfigurada(): boolean {
  return Boolean(process.env.FENYNX_API_URL && process.env.FENYNX_API_KEY && process.env.PRIVACIDADE_SEGREDO)
}

async function chamar(caminho: string): Promise<unknown> {
  const resposta = await fetch(`${process.env.FENYNX_API_URL}${caminho}`, {
    headers: { Authorization: `Bearer ${process.env.FENYNX_API_KEY}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })
  if (!resposta.ok) throw new Error(`API Fenynx respondeu ${resposta.status}`)
  return resposta.json()
}

/** Troca o tomador pelo codigo do cliente. O nome e o documento nao saem desta funcao. */
export function semDadoPessoal(e: EmprestimoApi, segredo?: string): EmprestimoFenynx {
  return {
    id: e.id,
    produto: e.produto,
    ativo: e.ativo,
    modelo: e.modelo ?? null,
    garantiaQtd: e.garantia_quantidade,
    principal: e.principal_brl,
    tac: e.tac_brl,
    taxaMensal: e.taxa_mensal,
    meses: e.prazo_meses,
    saldoDevedor: e.saldo_devedor_brl,
    ltv: e.ltv,
    status: e.status,
    iniciadoEm: e.iniciado_em,
    contaXrpl: e.conta_xrpl ?? null,
    cliente: pseudonimo(e.tomador.documento || e.tomador.id, segredo),
  }
}

/** Emprestimos da Fenynx, ja sem dado pessoal. Lista vazia quando a integracao nao esta configurada. */
export async function listarEmprestimos(): Promise<EmprestimoFenynx[]> {
  if (!integracaoConfigurada()) return []
  const corpo = (await chamar('/v1/emprestimos')) as { items?: EmprestimoApi[] }
  return (corpo.items ?? []).map((e) => semDadoPessoal(e))
}

/**
 * Revela o nome do tomador de um emprestimo. Cada chamada deixa um registro de auditoria
 * com quem pediu e quando. O nome nao e guardado no portal.
 */
export async function revelarIdentidade(emprestimoId: string, solicitante: string): Promise<IdentidadeRevelada> {
  if (!integracaoConfigurada()) throw new Error('Integracao com a Fenynx nao configurada')
  const e = (await chamar(`/v1/emprestimos/${encodeURIComponent(emprestimoId)}`)) as EmprestimoApi
  const cliente = pseudonimo(e.tomador.documento || e.tomador.id)
  console.info(
    JSON.stringify({ evento: 'revelacao_identidade', emprestimo: emprestimoId, cliente, solicitante, em: new Date().toISOString() }),
  )
  return { cliente, nome: e.tomador.nome, documentoMascarado: mascararDocumento(e.tomador.documento) }
}
