import { existsSync, writeFileSync } from 'node:fs'
import { Client } from 'xrpl'
import { ARQUIVO_ENV, PAPEIS, enderecoWss } from '../lib/xrpl/config'

/** Cria uma carteira de teste por papel no faucet da Devnet e grava as seeds em .env.local. */
async function main(): Promise<void> {
  if (existsSync(ARQUIVO_ENV) && !process.argv.includes('--novo')) {
    console.log('.env.local ja existe. Use --novo para gerar carteiras novas.')
    return
  }
  const wss = enderecoWss()
  const client = new Client(wss)
  await client.connect()
  const linhas = [`XRPL_WSS=${wss}`, 'LEDGER_MODE=devnet']
  for (const papel of PAPEIS) {
    const { wallet, balance } = await client.fundWallet()
    if (!wallet.seed) throw new Error(`Faucet nao devolveu seed para ${papel}`)
    linhas.push(`SEED_${papel}=${wallet.seed}`)
    console.log(`${papel.padEnd(18)} ${wallet.address}  ${balance} XRP`)
  }
  writeFileSync(ARQUIVO_ENV, `${linhas.join('\n')}\n`, { mode: 0o600 })
  console.log('Seeds gravadas em .env.local')
  await client.disconnect()
}

main().catch((erro: unknown) => {
  console.error(erro)
  process.exit(1)
})
