import { abrirOperacao, type PedidoOperacao } from '../lib/xrpl/operacoes'
import { comLedger } from '../lib/xrpl/servidor'

/** Abre na Devnet as operacoes de demonstracao do portal. */
const PEDIDOS: PedidoOperacao[] = [
  { produto: 'iphone', ativo: 'XRP', ltvEntrada: 0.5, modeloId: '18-pro-max' },
  { produto: 'credito', ativo: 'XRP', ltvEntrada: 0.35, principal: 15000 },
  { produto: 'credito', ativo: 'MPT', ltvEntrada: 0.5, principal: 10000 },
]

for (const pedido of PEDIDOS) {
  const conta = await comLedger((ctx) => abrirOperacao(ctx, pedido))
  console.log(`${pedido.produto} ${pedido.ativo} ${conta}`)
}
