import {
  Client,
  multisign,
  type SubmittableTransaction,
  type TransactionMetadata,
  type Wallet,
} from 'xrpl'
import { EXPLORER } from './config'

export interface Recibo {
  tipo: string
  conta: string
  hash: string
  resultado: string
  link: string
  meta: TransactionMetadata
  /** Sequence da transacao, usada para cancelar ofertas. */
  sequencia?: number
}

function extrairMeta(meta: unknown): TransactionMetadata {
  if (meta === null || typeof meta !== 'object') {
    throw new Error('Transacao sem metadata validada')
  }
  return meta as TransactionMetadata
}

export function montarRecibo(
  tx: SubmittableTransaction,
  hash: string,
  metaBruta: unknown,
): Recibo {
  const meta = extrairMeta(metaBruta)
  const resultado = meta.TransactionResult
  const recibo: Recibo = {
    tipo: tx.TransactionType,
    conta: tx.Account,
    hash,
    resultado,
    link: `${EXPLORER}/transactions/${hash}`,
    meta,
  }
  if (resultado !== 'tesSUCCESS') {
    throw new Error(`${tx.TransactionType} falhou com ${resultado}. ${recibo.link}`)
  }
  return recibo
}

/** Assina com uma chave e espera a validacao no ledger. */
export async function enviar(
  client: Client,
  assinante: Wallet,
  tx: SubmittableTransaction,
): Promise<Recibo> {
  const resposta = await client.submitAndWait(tx, { wallet: assinante, autofill: true })
  const recibo = montarRecibo(tx, resposta.result.hash, resposta.result.meta)
  recibo.sequencia = resposta.result.tx_json.Sequence
  return recibo
}

/** Assinatura multipla. A conta nao assina, quem assina sao os signatarios da SignerList. */
export async function enviarMultisig(
  client: Client,
  signatarios: Wallet[],
  tx: SubmittableTransaction,
): Promise<Recibo> {
  const preparada = await client.autofill(tx, signatarios.length)
  const blobs = signatarios.map((s) => s.sign(preparada, true).tx_blob)
  const resposta = await client.submitAndWait(multisign(blobs))
  return montarRecibo(tx, resposta.result.hash, resposta.result.meta)
}

/** LedgerIndex do objeto criado pela transacao, por tipo de ledger entry. */
export function idCriado(meta: TransactionMetadata, tipo: string): string {
  for (const no of meta.AffectedNodes) {
    if ('CreatedNode' in no && no.CreatedNode.LedgerEntryType === tipo) {
      return no.CreatedNode.LedgerIndex
    }
  }
  throw new Error(`Nenhum objeto ${tipo} criado nesta transacao`)
}

export async function lerEntrada<T>(client: Client, id: string): Promise<T> {
  const resposta = await client.request({
    command: 'ledger_entry',
    index: id,
    ledger_index: 'validated',
  })
  return resposta.result.node as unknown as T
}

/** Horario do ultimo ledger validado, em segundos da epoca Ripple. */
export async function horarioLedger(client: Client): Promise<number> {
  const resposta = await client.request({ command: 'ledger', ledger_index: 'validated' })
  return resposta.result.ledger.close_time
}

export async function esperarHorarioLedger(client: Client, alvo: number): Promise<void> {
  for (;;) {
    const agora = await horarioLedger(client)
    if (agora > alvo) return
    await new Promise((ok) => setTimeout(ok, Math.min((alvo - agora + 2) * 1000, 15000)))
  }
}
