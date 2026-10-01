import { mkdirSync, writeFileSync } from 'node:fs'
import { Client } from 'xrpl'
import { calcularLTV, colateralLiberavel, nivelCobertura } from '../lib/domain/credito'
import type { TermosEmprestimo } from '../lib/xrpl/adapter'
import { carteiras, enderecoWss } from '../lib/xrpl/config'
import { DevnetAdapter } from '../lib/xrpl/devnet'
import { esperarHorarioLedger, type Recibo } from '../lib/xrpl/tx'

// Parametros de teste do spike. Nao sao numeros de negocio.
const PRECO_ENTRADA = 10 // BRL por XRP
const PRECO_ESTRESSE = 6 // BRL por XRP
const COLATERAL_XRP = 40
const PRINCIPAL = '200'

interface Linha {
  etapa: string
  passo: string
  tipo: string
  conta: string
  hash: string
  link: string
}

const diario: Linha[] = []
const notas: string[] = []

function registrar(etapa: string, passo: string, recibos: Recibo | Recibo[]): void {
  for (const r of Array.isArray(recibos) ? recibos : [recibos]) {
    diario.push({ etapa, passo, tipo: r.tipo, conta: r.conta, hash: r.hash, link: r.link })
    console.log(`  ok  ${r.tipo.padEnd(24)} ${r.hash}`)
  }
}

function nota(texto: string): void {
  notas.push(texto)
  console.log(`  >>  ${texto}`)
}

function titulo(texto: string): void {
  console.log(`\n== ${texto}`)
}

function pct(valor: number): string {
  return `${(valor * 100).toFixed(1)}%`
}

async function main(): Promise<void> {
  const client = new Client(enderecoWss())
  await client.connect()
  const c = carteiras()
  const ledger = new DevnetAdapter(client, c)
  const termos = (parcelas: number, intervalo: number): TermosEmprestimo => ({
    principalBRL: PRINCIPAL,
    taxaAnual: 24000,
    parcelas,
    intervaloSegundos: intervalo,
    carenciaSegundos: 60,
    taxaOriginacaoBRL: '4',
  })

  // ------------------------------------------------------------------ A
  let etapa = 'A. Stablecoin de real'
  titulo(etapa)
  registrar(etapa, 'DefaultRipple no emissor e trust lines', await ledger.prepararMoeda())
  registrar(etapa, 'Emissao para o investidor', await ledger.emitirBRL(c.INVESTIDOR.address, '5000'))
  registrar(etapa, 'Emissao para a Fenynx', await ledger.emitirBRL(c.FENYNX.address, '1000'))
  registrar(etapa, 'Emissao para o formador de mercado', await ledger.emitirBRL(c.FORMADOR_MERCADO.address, '2000'))
  registrar(etapa, 'Saldo proprio do tomador', await ledger.emitirBRL(c.TOMADOR.address, '50'))

  // ------------------------------------------------------------------ B
  etapa = 'B. Funding com XLS 65 e XLS 66'
  titulo(etapa)
  const { vaultId, fimCaptacao, recibo: rVault } = await ledger.criarVault({
    captacaoSegundos: 60,
    investimentoSegundos: 7 * 24 * 3600,
  })
  registrar(etapa, 'Vault fechado em BRL', rVault)
  registrar(etapa, 'Deposito do investidor na janela de captacao', await ledger.depositarNoVault(vaultId, '3000'))
  const { brokerId, recibo: rBroker } = await ledger.registrarBroker(vaultId, {
    managementFeeRate: 1000,
    debtMaximum: '100000',
    coverRateMinimum: 10000,
    coverRateLiquidation: 100000,
  })
  registrar(etapa, 'Loan broker da Fenynx', rBroker)
  registrar(etapa, 'First loss capital', await ledger.depositarCover(brokerId, '300'))
  console.log('  aguardando o fim da captacao para iniciar o periodo de investimento')
  await esperarHorarioLedger(client, fimCaptacao)
  const vaultInicial = await ledger.estadoVault(vaultId)
  nota(`Vault ${vaultId} com ${vaultInicial.ativosDisponiveis} BRL disponiveis`)

  // ------------------------------------------------------------------ C
  etapa = 'C. Operacao 1, curso normal com liberacao parcial'
  titulo(etapa)
  const op1 = await ledger.abrirContaOperacao()
  registrar(etapa, 'Conta da operacao com multisig e chave mestra desativada', op1.recibos)
  registrar(etapa, 'Cliente trava XRP', await ledger.travarColateralXRP(op1.conta, String(COLATERAL_XRP)))
  let travado = COLATERAL_XRP
  const ltvEntrada = calcularLTV(Number(PRINCIPAL), travado, PRECO_ENTRADA)
  nota(`LTV de entrada ${pct(ltvEntrada)} nivel ${nivelCobertura(ltvEntrada)}`)
  const loan1 = await ledger.emitirEmprestimo(brokerId, op1.conta, termos(3, 600))
  registrar(etapa, 'LoanSet com contra assinatura multisig', loan1.recibo)
  const recebido1 = await ledger.saldoBRL(op1.conta)
  registrar(etapa, 'Desembolso ao cliente', await ledger.desembolsar(op1.conta, String(recebido1)))
  nota(`Principal ${PRINCIPAL} BRL, liquido desembolsado ${recebido1} BRL`)

  let estado1 = await ledger.estadoEmprestimo(loan1.loanId)
  const parcela = (Math.ceil(estado1.parcelaPeriodica * 100) / 100).toFixed(2)
  registrar(etapa, 'Pagamento do cliente chega em BRL', await ledger.aportarPagamento(op1.conta, parcela))
  const pago1 = await ledger.pagarEmprestimo(op1.conta, loan1.loanId, 'parcela')
  registrar(etapa, 'LoanPay da parcela 1', pago1.recibo)
  estado1 = await ledger.estadoEmprestimo(loan1.loanId)
  const liberavel = colateralLiberavel(travado, estado1.principalEmAberto, PRECO_ENTRADA)
  const liberar = liberavel.toFixed(6)
  registrar(etapa, 'Liberacao parcial do colateral', await ledger.liberarColateralXRP(op1.conta, liberar))
  travado -= Number(liberar)
  nota(
    `Parcela ${pago1.valorPago} BRL paga, principal em aberto ${estado1.principalEmAberto.toFixed(2)} BRL, ` +
      `liberados ${liberar} XRP, seguem travados ${travado.toFixed(6)} XRP`,
  )

  const quitacao = (Math.ceil(estado1.valorTotalEmAberto * 100) / 100).toFixed(2)
  const faltaAportar = Math.max(0, Number(quitacao) - (await ledger.saldoBRL(op1.conta)))
  registrar(etapa, 'Cliente aporta o saldo', await ledger.aportarPagamento(op1.conta, faltaAportar.toFixed(2)))
  const antesQuitar = await ledger.saldoBRL(op1.conta)
  const pagoFinal = await ledger.pagarEmprestimo(op1.conta, loan1.loanId, 'quitacao', quitacao)
  registrar(etapa, 'LoanPay de quitacao antecipada', pagoFinal.recibo)
  const cobrado = antesQuitar - (await ledger.saldoBRL(op1.conta))
  nota(`Quitacao antecipada cobrou ${cobrado.toFixed(4)} BRL de um teto de ${quitacao} BRL`)
  registrar(etapa, 'Liberacao total do colateral', await ledger.liberarColateralXRP(op1.conta, travado.toFixed(6)))

  // ------------------------------------------------------------------ D
  etapa = 'D. Operacao 2, queda de preco e liquidacao na DEX'
  titulo(etapa)
  const op2 = await ledger.abrirContaOperacao()
  registrar(etapa, 'Conta da operacao', op2.recibos)
  registrar(etapa, 'Cliente trava XRP', await ledger.travarColateralXRP(op2.conta, String(COLATERAL_XRP)))
  const loan2 = await ledger.emitirEmprestimo(brokerId, op2.conta, termos(3, 600))
  registrar(etapa, 'LoanSet', loan2.recibo)
  const recebido2 = await ledger.saldoBRL(op2.conta)
  registrar(etapa, 'Desembolso ao cliente', await ledger.desembolsar(op2.conta, String(recebido2)))
  registrar(
    etapa,
    'Formador de mercado compra XRP ao preco de estresse',
    await ledger.publicarCompraXRP('80', PRECO_ESTRESSE),
  )
  const estado2 = await ledger.estadoEmprestimo(loan2.loanId)
  const ltvEstresse = calcularLTV(estado2.valorTotalEmAberto, COLATERAL_XRP, PRECO_ESTRESSE)
  nota(`Preco cai de ${PRECO_ENTRADA} para ${PRECO_ESTRESSE} BRL, LTV ${pct(ltvEstresse)} nivel ${nivelCobertura(ltvEstresse)}`)
  const divida = (Math.ceil(estado2.valorTotalEmAberto * 100) / 100).toFixed(2)
  const venda = await ledger.liquidarColateralXRP(op2.conta, divida)
  registrar(etapa, 'Venda do colateral na DEX nativa', venda.recibo)
  nota(`Vendidos ${venda.xrpVendido.toFixed(6)} XRP por ${venda.brlObtido.toFixed(2)} BRL`)
  const quit2 = await ledger.pagarEmprestimo(op2.conta, loan2.loanId, 'quitacao', divida)
  registrar(etapa, 'LoanPay de quitacao com o produto da venda', quit2.recibo)
  const sobraBRL = await ledger.saldoBRL(op2.conta)
  if (sobraBRL > 0) {
    registrar(etapa, 'Devolucao do excedente em BRL', await ledger.desembolsar(op2.conta, String(sobraBRL)))
  }
  const sobraXRP = COLATERAL_XRP - venda.xrpVendido
  registrar(etapa, 'Devolucao do excedente em XRP', await ledger.liberarColateralXRP(op2.conta, sobraXRP.toFixed(6)))
  nota(`Excedente devolvido ao cliente: ${sobraXRP.toFixed(6)} XRP e ${sobraBRL} BRL`)

  // ------------------------------------------------------------------ E
  etapa = 'E. Operacao 3, MPT como colateral'
  titulo(etapa)
  const token = await ledger.emitirTokenColateral('50000')
  registrar(etapa, 'Tokenizadora emite MPT e entrega ao cliente', token.recibos)
  const op3 = await ledger.abrirContaOperacao()
  registrar(etapa, 'Conta da operacao', op3.recibos)
  registrar(etapa, 'Trava do MPT', await ledger.travarColateralMPT(op3.conta, token.emissaoId, '50000'))
  nota(`MPT ${token.emissaoId} travado, saldo na conta ${await ledger.saldoMPT(op3.conta, token.emissaoId)}`)
  registrar(etapa, 'Liberacao do MPT', await ledger.liberarColateralMPT(op3.conta, token.emissaoId, '50000'))
  nota(`Saldo de MPT na conta apos liberar ${await ledger.saldoMPT(op3.conta, token.emissaoId)}`)

  // ------------------------------------------------------------------ F
  etapa = 'F. Operacao 4, inadimplencia e first loss capital'
  titulo(etapa)
  const op4 = await ledger.abrirContaOperacao()
  registrar(etapa, 'Conta da operacao', op4.recibos)
  const loan4 = await ledger.emitirEmprestimo(brokerId, op4.conta, termos(1, 60))
  registrar(etapa, 'LoanSet', loan4.recibo)
  const recebido4 = await ledger.saldoBRL(op4.conta)
  registrar(etapa, 'Desembolso ao cliente', await ledger.desembolsar(op4.conta, String(recebido4)))
  const estado4 = await ledger.estadoEmprestimo(loan4.loanId)
  const brokerAntes = await ledger.estadoBroker(brokerId)
  const vaultAntes = await ledger.estadoVault(vaultId)
  console.log('  aguardando vencimento e carencia no ledger')
  await esperarHorarioLedger(client, estado4.proximoVencimento + estado4.carencia)
  registrar(etapa, 'LoanManage com tfLoanDefault', await ledger.declararInadimplencia(loan4.loanId))
  const brokerDepois = await ledger.estadoBroker(brokerId)
  const vaultDepois = await ledger.estadoVault(vaultId)
  nota(
    `Cover de ${brokerAntes.coverDisponivel.toFixed(2)} para ${brokerDepois.coverDisponivel.toFixed(2)} BRL, ` +
      `ativos do vault de ${vaultAntes.ativosTotais.toFixed(2)} para ${vaultDepois.ativosTotais.toFixed(2)} BRL`,
  )

  mkdirSync('docs', { recursive: true })
  writeFileSync(
    'docs/spike-devnet.json',
    JSON.stringify(
      {
        rede: enderecoWss(),
        executadoEm: new Date().toISOString(),
        contas: Object.fromEntries(Object.entries(c).map(([papel, w]) => [papel, w.address])),
        vaultId,
        brokerId,
        operacoes: { op1: op1.conta, op2: op2.conta, op3: op3.conta, op4: op4.conta },
        emprestimos: { op1: loan1.loanId, op2: loan2.loanId, op4: loan4.loanId },
        mpt: token.emissaoId,
        notas,
        transacoes: diario,
      },
      null,
      2,
    ),
  )
  console.log(`\n${diario.length} transacoes validadas. Registro em docs/spike-devnet.json`)
  await client.disconnect()
}

main().catch((erro: unknown) => {
  console.error(erro)
  process.exit(1)
})
