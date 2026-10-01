import { Client, type Wallet } from 'xrpl'
import { carteiras, enderecoWss, type Papel } from './config'
import { DevnetAdapter } from './devnet'

export interface Contexto {
  client: Client
  ledger: DevnetAdapter
  c: Record<Papel, Wallet>
}

/** Abre uma conexao com o ledger pelo tempo de uma requisicao. */
export async function comLedger<T>(fn: (ctx: Contexto) => Promise<T>): Promise<T> {
  const client = new Client(enderecoWss(), { connectionTimeout: 15000 })
  await client.connect()
  try {
    const c = carteiras()
    return await fn({ client, ledger: new DevnetAdapter(client, c), c })
  } finally {
    await client.disconnect()
  }
}
