import {
  AccountSetAsfFlags,
  Client,
  LoanManageFlags,
  LoanPayFlags,
  OfferCreateFlags,
  VaultKind,
  Wallet,
  combineLoanSetCounterpartySigners,
  dropsToXrp,
  signLoanSetByCounterparty,
  xrpToDrops,
  type IssuedCurrencyAmount,
  type LoanSet,
  type SubmittableTransaction,
} from 'xrpl'
import type {
  EstadoBroker,
  EstadoEmprestimo,
  EstadoGarantia,
  EstadoVault,
  LedgerAdapter,
  ModoPagamento,
  ParametrosBroker,
  ParametrosVault,
  TermosEmprestimo,
} from './adapter'
import { MOEDA_BRL, type Papel } from './config'
import {
  enviar,
  enviarMultisig,
  horarioLedger,
  idCriado,
  lerEntrada,
  montarRecibo,
  type Recibo,
} from './tx'

const LSF_LOAN_DEFAULT = 0x00010000
const EPOCA_RIPPLE = 946684800
export const ORACULO_ID = 1

function hex(texto: string): string {
  return Buffer.from(texto, 'utf8').toString('hex').toUpperCase()
}

export const TIPO_MEMO = 'fenynx/v1'
export const TIPO_MEMO_LASTRO = 'fenynx/lastro/v1'

function memo(registro: object, tipo: string = TIPO_MEMO): { Memo: { MemoType: string; MemoData: string } }[] {
  return [{ Memo: { MemoType: hex(tipo), MemoData: hex(JSON.stringify(registro)) } }]
}
const LIMITE_TRUSTLINE = '1000000000'
/** Cobre a reserva da conta e de seus objetos. Volta para a Fenynx no encerramento. */
const RESERVA_INICIAL_XRP = '3'

interface EntradaLoan {
  Borrower: string
  Flags: number
  PrincipalOutstanding?: string
  TotalValueOutstanding?: string
  PeriodicPayment: string
  LoanServiceFee?: string
  PaymentRemaining?: number
  NextPaymentDueDate?: number
  GracePeriod: number
}

interface EntradaVault {
  AssetsTotal?: string
  AssetsAvailable?: string
  LossUnrealized?: string
}

interface EntradaBroker {
  DebtTotal?: string
  CoverAvailable?: string
}

function numero(valor: string | undefined): number {
  return valor === undefined ? 0 : Number(valor)
}

/** Arredonda para cima em centavos. O ledger recusa pagamento menor que a parcela. */
function centavosParaCima(valor: number): string {
  return (Math.ceil(valor * 100 - 1e-9) / 100).toFixed(2)
}

export class DevnetAdapter implements LedgerAdapter {
  constructor(
    private readonly client: Client,
    private readonly c: Record<Papel, Wallet>,
  ) {}

  private brl(valor: string): IssuedCurrencyAmount {
    return { currency: MOEDA_BRL, issuer: this.c.EMISSOR_BRL.address, value: valor }
  }

  /** Os dois signatarios da conta de garantia: motor Fenynx e agente de garantia. */
  private get signatarios(): Wallet[] {
    return [this.c.FENYNX, this.c.AGENTE_GARANTIA]
  }

  private multisig(tx: SubmittableTransaction): Promise<Recibo> {
    return enviarMultisig(this.client, this.signatarios, tx)
  }

  // ---------------------------------------------------------------- moeda

  async prepararMoeda(): Promise<Recibo[]> {
    const recibos: Recibo[] = []
    // DefaultRipple precisa vir antes das trust lines para o token circular na DEX.
    recibos.push(
      await enviar(this.client, this.c.EMISSOR_BRL, {
        TransactionType: 'AccountSet',
        Account: this.c.EMISSOR_BRL.address,
        SetFlag: AccountSetAsfFlags.asfDefaultRipple,
      }),
    )
    const titulares: Papel[] = ['FENYNX', 'INVESTIDOR', 'TOMADOR', 'FORMADOR_MERCADO']
    for (const papel of titulares) {
      recibos.push(
        await enviar(this.client, this.c[papel], {
          TransactionType: 'TrustSet',
          Account: this.c[papel].address,
          LimitAmount: this.brl(LIMITE_TRUSTLINE),
        }),
      )
    }
    return recibos
  }

  emitirBRL(destino: string, valor: string): Promise<Recibo> {
    return enviar(this.client, this.c.EMISSOR_BRL, {
      TransactionType: 'Payment',
      Account: this.c.EMISSOR_BRL.address,
      Destination: destino,
      Amount: this.brl(valor),
    })
  }

  // -------------------------------------------------------------- funding

  /**
   * Vault fechado. Desde LendingProtocolV1_1 so vault fechado aceita loan broker:
   * depositos ate o fim da captacao, emprestimos no periodo de investimento,
   * resgates a partir da data de resgate.
   */
  async criarVault(
    p: ParametrosVault,
  ): Promise<{ vaultId: string; fimCaptacao: number; recibo: Recibo }> {
    const agora = await horarioLedger(this.client)
    const fimCaptacao = agora + p.captacaoSegundos
    const recibo = await enviar(this.client, this.c.FENYNX, {
      TransactionType: 'VaultCreate',
      Account: this.c.FENYNX.address,
      Asset: { currency: MOEDA_BRL, issuer: this.c.EMISSOR_BRL.address },
      VaultKind: VaultKind.vaultKindClosed,
      SubscriptionDate: fimCaptacao,
      RedemptionDate: fimCaptacao + p.investimentoSegundos,
    })
    return { vaultId: idCriado(recibo.meta, 'Vault'), fimCaptacao, recibo }
  }

  async registrarBroker(
    vaultId: string,
    p: ParametrosBroker,
  ): Promise<{ brokerId: string; recibo: Recibo }> {
    const recibo = await enviar(this.client, this.c.FENYNX, {
      TransactionType: 'LoanBrokerSet',
      Account: this.c.FENYNX.address,
      VaultID: vaultId,
      ManagementFeeRate: p.managementFeeRate,
      DebtMaximum: p.debtMaximum,
      CoverRateMinimum: p.coverRateMinimum,
      CoverRateLiquidation: p.coverRateLiquidation,
    })
    return { brokerId: idCriado(recibo.meta, 'LoanBroker'), recibo }
  }

  depositarCover(brokerId: string, valorBRL: string): Promise<Recibo> {
    return enviar(this.client, this.c.FENYNX, {
      TransactionType: 'LoanBrokerCoverDeposit',
      Account: this.c.FENYNX.address,
      LoanBrokerID: brokerId,
      Amount: this.brl(valorBRL),
    })
  }

  depositarNoVault(vaultId: string, valorBRL: string): Promise<Recibo> {
    return enviar(this.client, this.c.INVESTIDOR, {
      TransactionType: 'VaultDeposit',
      Account: this.c.INVESTIDOR.address,
      VaultID: vaultId,
      Amount: this.brl(valorBRL),
    })
  }

  declararInadimplencia(loanId: string): Promise<Recibo> {
    return enviar(this.client, this.c.FENYNX, {
      TransactionType: 'LoanManage',
      Account: this.c.FENYNX.address,
      LoanID: loanId,
      Flags: LoanManageFlags.tfLoanDefault,
    })
  }

  // ------------------------------------------------------ conta da operacao

  /**
   * Uma conta por operacao. Depois da SignerList a chave mestra e desativada e
   * descartada, entao so o par Fenynx mais agente de garantia movimenta a conta.
   */
  async abrirContaOperacao(): Promise<{ conta: string; recibos: Recibo[] }> {
    const nova = Wallet.generate()
    const recibos: Recibo[] = []
    recibos.push(
      await enviar(this.client, this.c.FENYNX, {
        TransactionType: 'Payment',
        Account: this.c.FENYNX.address,
        Destination: nova.address,
        Amount: xrpToDrops(RESERVA_INICIAL_XRP),
      }),
    )
    recibos.push(
      await enviar(this.client, nova, {
        TransactionType: 'SignerListSet',
        Account: nova.address,
        SignerQuorum: 2,
        SignerEntries: this.signatarios.map((s) => ({
          SignerEntry: { Account: s.address, SignerWeight: 1 },
        })),
      }),
    )
    recibos.push(
      await enviar(this.client, nova, {
        TransactionType: 'AccountSet',
        Account: nova.address,
        SetFlag: AccountSetAsfFlags.asfDisableMaster,
      }),
    )
    recibos.push(
      await this.multisig({
        TransactionType: 'TrustSet',
        Account: nova.address,
        LimitAmount: this.brl(LIMITE_TRUSTLINE),
      }),
    )
    return { conta: nova.address, recibos }
  }

  async emitirEmprestimo(
    brokerId: string,
    conta: string,
    t: TermosEmprestimo,
  ): Promise<{ loanId: string; recibo: Recibo }> {
    const tx: LoanSet = {
      TransactionType: 'LoanSet',
      Account: this.c.FENYNX.address,
      Counterparty: conta,
      LoanBrokerID: brokerId,
      PrincipalRequested: t.principalBRL,
      InterestRate: t.taxaAnual,
      PaymentTotal: t.parcelas,
      PaymentInterval: t.intervaloSegundos,
      GracePeriod: t.carenciaSegundos,
      LoanOriginationFee: t.taxaOriginacaoBRL,
    }
    // O emprestimo so existe com as duas partes: o broker assina primeiro e a
    // conta da operacao contra assina com seus dois signatarios.
    const preparada = await this.client.autofill(tx)
    const assinadaBroker = this.c.FENYNX.sign(preparada).tx_blob
    const contraAssinadas = this.signatarios.map(
      (s) => signLoanSetByCounterparty(s, assinadaBroker, { multisign: true }).tx_blob,
    )
    const completa = combineLoanSetCounterpartySigners(contraAssinadas)
    const resposta = await this.client.submitAndWait(completa.tx_blob)
    const recibo = montarRecibo(tx, resposta.result.hash, resposta.result.meta)
    return { loanId: idCriado(recibo.meta, 'Loan'), recibo }
  }

  /** Em producao este passo e o resgate do BBRL com Pix para o cliente. */
  desembolsar(conta: string, valorBRL: string): Promise<Recibo> {
    return this.multisig({
      TransactionType: 'Payment',
      Account: conta,
      Destination: this.c.TOMADOR.address,
      Amount: this.brl(valorBRL),
    })
  }

  /** Em producao este passo e o Pix do cliente convertido em BBRL. */
  aportarPagamento(conta: string, valorBRL: string): Promise<Recibo> {
    return enviar(this.client, this.c.TOMADOR, {
      TransactionType: 'Payment',
      Account: this.c.TOMADOR.address,
      Destination: conta,
      Amount: this.brl(valorBRL),
    })
  }

  async pagarEmprestimo(
    conta: string,
    loanId: string,
    modo: ModoPagamento,
    valorBRL?: string,
  ): Promise<{ valorPago: string; recibo: Recibo }> {
    const loan = await lerEntrada<EntradaLoan>(this.client, loanId)
    const valorPago =
      valorBRL ?? centavosParaCima(numero(loan.PeriodicPayment) + numero(loan.LoanServiceFee))
    const recibo = await this.multisig({
      TransactionType: 'LoanPay',
      Account: conta,
      LoanID: loanId,
      Amount: this.brl(valorPago),
      ...(modo === 'quitacao' ? { Flags: LoanPayFlags.tfLoanFullPayment } : {}),
      ...(modo === 'atraso' ? { Flags: LoanPayFlags.tfLoanLatePayment } : {}),
    })
    return { valorPago, recibo }
  }

  // ------------------------------------------------------------- garantia

  travarColateralXRP(conta: string, quantidadeXRP: string): Promise<Recibo> {
    return enviar(this.client, this.c.TOMADOR, {
      TransactionType: 'Payment',
      Account: this.c.TOMADOR.address,
      Destination: conta,
      Amount: xrpToDrops(quantidadeXRP),
    })
  }

  liberarColateralXRP(conta: string, quantidadeXRP: string): Promise<Recibo> {
    return this.multisig({
      TransactionType: 'Payment',
      Account: conta,
      Destination: this.c.TOMADOR.address,
      Amount: xrpToDrops(quantidadeXRP),
    })
  }

  /**
   * Vende na DEX nativa apenas o XRP necessario para obter a divida em BRL.
   * O BRL fica na conta da operacao, que em seguida quita o emprestimo.
   */
  async liquidarColateralXRP(
    conta: string,
    dividaBRL: string,
  ): Promise<{ xrpVendido: number; brlObtido: number; recibo: Recibo }> {
    const antes = await this.estadoGarantia(conta)
    const brlAntes = await this.saldoBRL(conta)
    const recibo = await this.multisig({
      TransactionType: 'OfferCreate',
      Account: conta,
      TakerGets: xrpToDrops((antes.colateralXRP - 0.3).toFixed(6)),
      TakerPays: this.brl(dividaBRL),
      Flags: OfferCreateFlags.tfImmediateOrCancel,
    })
    const depois = await this.estadoGarantia(conta)
    return {
      xrpVendido: antes.saldoXRP - depois.saldoXRP,
      brlObtido: (await this.saldoBRL(conta)) - brlAntes,
      recibo,
    }
  }

  /** Apoio de teste. O formador de mercado compra XRP pagando BRL ao preco informado. */
  publicarCompraXRP(quantidadeXRP: string, precoBRL: number): Promise<Recibo> {
    return enviar(this.client, this.c.FORMADOR_MERCADO, {
      TransactionType: 'OfferCreate',
      Account: this.c.FORMADOR_MERCADO.address,
      TakerPays: xrpToDrops(quantidadeXRP),
      TakerGets: this.brl((Number(quantidadeXRP) * precoBRL).toFixed(2)),
    })
  }

  async emitirTokenColateral(
    quantidade: string,
  ): Promise<{ emissaoId: string; recibos: Recibo[] }> {
    const recibos: Recibo[] = []
    const criacao = await enviar(this.client, this.c.TOKENIZADORA, {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: this.c.TOKENIZADORA.address,
      AssetScale: 2,
      MaximumAmount: '100000000',
      Flags: { tfMPTCanTransfer: true, tfMPTCanEscrow: true, tfMPTCanLock: true },
    })
    recibos.push(criacao)
    const emissaoId =
      'mpt_issuance_id' in criacao.meta && typeof criacao.meta.mpt_issuance_id === 'string'
        ? criacao.meta.mpt_issuance_id
        : undefined
    if (!emissaoId) throw new Error('Emissao de MPT sem mpt_issuance_id')
    recibos.push(
      await enviar(this.client, this.c.TOMADOR, {
        TransactionType: 'MPTokenAuthorize',
        Account: this.c.TOMADOR.address,
        MPTokenIssuanceID: emissaoId,
      }),
    )
    recibos.push(
      await enviar(this.client, this.c.TOKENIZADORA, {
        TransactionType: 'Payment',
        Account: this.c.TOKENIZADORA.address,
        Destination: this.c.TOMADOR.address,
        Amount: { mpt_issuance_id: emissaoId, value: quantidade },
      }),
    )
    return { emissaoId, recibos }
  }

  async travarColateralMPT(conta: string, emissaoId: string, quantidade: string): Promise<Recibo[]> {
    const recibos: Recibo[] = []
    recibos.push(
      await this.multisig({
        TransactionType: 'MPTokenAuthorize',
        Account: conta,
        MPTokenIssuanceID: emissaoId,
      }),
    )
    recibos.push(
      await enviar(this.client, this.c.TOMADOR, {
        TransactionType: 'Payment',
        Account: this.c.TOMADOR.address,
        Destination: conta,
        Amount: { mpt_issuance_id: emissaoId, value: quantidade },
      }),
    )
    return recibos
  }

  liberarColateralMPT(conta: string, emissaoId: string, quantidade: string): Promise<Recibo> {
    return this.multisig({
      TransactionType: 'Payment',
      Account: conta,
      Destination: this.c.TOMADOR.address,
      Amount: { mpt_issuance_id: emissaoId, value: quantidade },
    })
  }

  /** Retira do livro o que sobrou da oferta de teste do formador de mercado. */
  async cancelarCompraXRP(sequencia: number): Promise<void> {
    try {
      await enviar(this.client, this.c.FORMADOR_MERCADO, {
        TransactionType: 'OfferCancel',
        Account: this.c.FORMADOR_MERCADO.address,
        OfferSequence: sequencia,
      })
    } catch {
      // Oferta ja consumida por inteiro. Nada a cancelar.
    }
  }

  // ------------------------------------------ trilho sem vault: conta, registro, preco

  /** Conta da operacao sem trust line. Guarda a garantia em XRP e os registros do credito. */
  async abrirContaGarantia(): Promise<{ conta: string; recibos: Recibo[] }> {
    const nova = Wallet.generate()
    const recibos: Recibo[] = []
    recibos.push(
      await enviar(this.client, this.c.FENYNX, {
        TransactionType: 'Payment',
        Account: this.c.FENYNX.address,
        Destination: nova.address,
        Amount: xrpToDrops(RESERVA_INICIAL_XRP),
      }),
    )
    recibos.push(
      await enviar(this.client, nova, {
        TransactionType: 'SignerListSet',
        Account: nova.address,
        SignerQuorum: 2,
        SignerEntries: this.signatarios.map((s) => ({
          SignerEntry: { Account: s.address, SignerWeight: 1 },
        })),
      }),
    )
    recibos.push(
      await enviar(this.client, nova, {
        TransactionType: 'AccountSet',
        Account: nova.address,
        SetFlag: AccountSetAsfFlags.asfDisableMaster,
      }),
    )
    return { conta: nova.address, recibos }
  }

  /** Grava um registro do credito na conta da operacao, com as duas assinaturas. */
  registrar(conta: string, registro: object): Promise<Recibo> {
    return this.multisig({ TransactionType: 'AccountSet', Account: conta, Memos: memo(registro) })
  }

  /** Move XRP da conta da operacao com as duas assinaturas, com registro opcional no mesmo envio. */
  moverGarantiaXRP(conta: string, destino: string, quantidadeXRP: string, registro?: object): Promise<Recibo> {
    return this.multisig({
      TransactionType: 'Payment',
      Account: conta,
      Destination: destino,
      Amount: xrpToDrops(quantidadeXRP),
      ...(registro ? { Memos: memo(registro) } : {}),
    })
  }

  // -------------------------------------------------------- token MPT como garantia

  /** Emissao do token no ledger. Reaproveita a que ja existe para o ticker ou cria uma nova. */
  async emissaoDoToken(ticker: string): Promise<string> {
    const resposta = await this.client.request({
      command: 'account_objects',
      account: this.c.TOKENIZADORA.address,
      ledger_index: 'validated',
      limit: 400,
    })
    const itens: unknown[] = resposta.result.account_objects
    for (const item of itens) {
      if (item === null || typeof item !== 'object') continue
      const campos = item as Record<string, unknown>
      if (campos.MPTokenMetadata === hex(ticker) && typeof campos.mpt_issuance_id === 'string') {
        return campos.mpt_issuance_id
      }
    }
    const criacao = await enviar(this.client, this.c.TOKENIZADORA, {
      TransactionType: 'MPTokenIssuanceCreate',
      Account: this.c.TOKENIZADORA.address,
      AssetScale: 0,
      MPTokenMetadata: hex(ticker),
      Flags: { tfMPTCanTransfer: true, tfMPTCanEscrow: true, tfMPTCanLock: true },
    })
    const id = 'mpt_issuance_id' in criacao.meta ? criacao.meta.mpt_issuance_id : undefined
    if (typeof id !== 'string') throw new Error('Emissao de MPT sem mpt_issuance_id')
    return id
  }

  /** Verdadeiro quando a conta ja aceitou guardar este token. */
  async aceitaToken(conta: string, emissaoId: string): Promise<boolean> {
    const resposta = await this.client.request({
      command: 'account_objects',
      account: conta,
      type: 'mptoken',
      ledger_index: 'validated',
    })
    const itens: unknown[] = resposta.result.account_objects
    return itens.some(
      (item) => item !== null && typeof item === 'object' && (item as Record<string, unknown>).MPTokenIssuanceID === emissaoId,
    )
  }

  /** A tokenizadora entrega tokens ao cliente, como se ele tivesse investido na oferta. */
  async entregarToken(emissaoId: string, quantidade: number): Promise<void> {
    if (!(await this.aceitaToken(this.c.TOMADOR.address, emissaoId))) {
      await enviar(this.client, this.c.TOMADOR, {
        TransactionType: 'MPTokenAuthorize',
        Account: this.c.TOMADOR.address,
        MPTokenIssuanceID: emissaoId,
      })
    }
    await enviar(this.client, this.c.TOKENIZADORA, {
      TransactionType: 'Payment',
      Account: this.c.TOKENIZADORA.address,
      Destination: this.c.TOMADOR.address,
      Amount: { mpt_issuance_id: emissaoId, value: String(quantidade) },
    })
  }

  /** O cliente trava tokens na conta da operacao. */
  async travarToken(conta: string, emissaoId: string, quantidade: number): Promise<Recibo> {
    if (!(await this.aceitaToken(conta, emissaoId))) {
      await this.multisig({ TransactionType: 'MPTokenAuthorize', Account: conta, MPTokenIssuanceID: emissaoId })
    }
    return enviar(this.client, this.c.TOMADOR, {
      TransactionType: 'Payment',
      Account: this.c.TOMADOR.address,
      Destination: conta,
      Amount: { mpt_issuance_id: emissaoId, value: String(quantidade) },
    })
  }

  /** Move tokens da conta da operacao com as duas assinaturas. Destino e o cliente ou a Fenynx. */
  async moverToken(
    conta: string,
    destino: 'TOMADOR' | 'FENYNX',
    emissaoId: string,
    quantidade: number,
    registro?: object,
  ): Promise<Recibo> {
    const carteira = this.c[destino]
    if (!(await this.aceitaToken(carteira.address, emissaoId))) {
      await enviar(this.client, carteira, {
        TransactionType: 'MPTokenAuthorize',
        Account: carteira.address,
        MPTokenIssuanceID: emissaoId,
      })
    }
    return this.multisig({
      TransactionType: 'Payment',
      Account: conta,
      Destination: carteira.address,
      Amount: { mpt_issuance_id: emissaoId, value: String(quantidade) },
      ...(registro ? { Memos: memo(registro) } : {}),
    })
  }

  /** Grava no ledger um atestado do lastro, assinado pela Fenynx como monitora. */
  registrarAtestado(atestado: object): Promise<Recibo> {
    return enviar(this.client, this.c.FENYNX, {
      TransactionType: 'AccountSet',
      Account: this.c.FENYNX.address,
      Memos: memo(atestado, TIPO_MEMO_LASTRO),
    })
  }

  /** Publica precos simulados no oraculo nativo para testar os gatilhos de LTV. */
  async simularPrecos(precos: { XRP: number; BTC: number }): Promise<Recibo> {
    const agora = await horarioLedger(this.client)
    return enviar(this.client, this.c.FENYNX, {
      TransactionType: 'OracleSet',
      Account: this.c.FENYNX.address,
      OracleDocumentID: ORACULO_ID,
      Provider: hex('fenynx'),
      AssetClass: hex('currency'),
      LastUpdateTime: agora + EPOCA_RIPPLE,
      PriceDataSeries: (['XRP', 'BTC'] as const).map((ativo) => ({
        PriceData: {
          BaseAsset: ativo,
          QuoteAsset: MOEDA_BRL,
          AssetPrice: Math.round(precos[ativo] * 100),
          Scale: 2,
        },
      })),
    })
  }

  /** Remove a simulacao. O portal volta a usar o preco de mercado. */
  removerSimulacao(): Promise<Recibo> {
    return enviar(this.client, this.c.FENYNX, {
      TransactionType: 'OracleDelete',
      Account: this.c.FENYNX.address,
      OracleDocumentID: ORACULO_ID,
    })
  }

  /** Recarrega XRP de teste no faucet, mil por pedido, ate o saldo minimo. */
  async garantirXRP(papel: Papel, minimo: number): Promise<void> {
    let saldo = 0
    try {
      saldo = await this.client.getXrpBalance(this.c[papel].address)
    } catch {
      saldo = 0
    }
    for (let pedido = 0; saldo < minimo && pedido < 40; pedido += 1) {
      saldo = (await this.client.fundWallet(this.c[papel], { amount: '1000' })).balance
    }
  }

  /** Completa o saldo em BRL de teste de um papel. Usado so pelo spike com vault. */
  async garantirBRL(papel: Papel, minimo: number): Promise<Recibo | null> {
    const saldo = await this.saldoBRL(this.c[papel].address)
    if (saldo >= minimo) return null
    return this.emitirBRL(this.c[papel].address, (minimo - saldo).toFixed(2))
  }

  // --------------------------------------------------------------- leitura

  async estadoEmprestimo(loanId: string): Promise<EstadoEmprestimo> {
    const loan = await lerEntrada<EntradaLoan>(this.client, loanId)
    return {
      id: loanId,
      tomador: loan.Borrower,
      principalEmAberto: numero(loan.PrincipalOutstanding),
      valorTotalEmAberto: numero(loan.TotalValueOutstanding),
      parcelaPeriodica: numero(loan.PeriodicPayment),
      parcelasRestantes: loan.PaymentRemaining ?? 0,
      proximoVencimento: loan.NextPaymentDueDate ?? 0,
      carencia: loan.GracePeriod,
      inadimplente: (loan.Flags & LSF_LOAN_DEFAULT) !== 0,
    }
  }

  async estadoVault(vaultId: string): Promise<EstadoVault> {
    const vault = await lerEntrada<EntradaVault>(this.client, vaultId)
    return {
      id: vaultId,
      ativosTotais: numero(vault.AssetsTotal),
      ativosDisponiveis: numero(vault.AssetsAvailable),
      perdaNaoRealizada: numero(vault.LossUnrealized),
    }
  }

  async estadoBroker(brokerId: string): Promise<EstadoBroker> {
    const broker = await lerEntrada<EntradaBroker>(this.client, brokerId)
    return {
      id: brokerId,
      dividaTotal: numero(broker.DebtTotal),
      coverDisponivel: numero(broker.CoverAvailable),
    }
  }

  async estadoGarantia(conta: string): Promise<EstadoGarantia> {
    const [info, servidor] = await Promise.all([
      this.client.request({ command: 'account_info', account: conta, ledger_index: 'validated' }),
      this.client.request({ command: 'server_info' }),
    ])
    const ledger = servidor.result.info.validated_ledger
    if (!ledger) throw new Error('Servidor sem ledger validado')
    const dados = info.result.account_data
    const saldoXRP = Number(dropsToXrp(dados.Balance))
    const reservaXRP = ledger.reserve_base_xrp + ledger.reserve_inc_xrp * dados.OwnerCount
    return { conta, saldoXRP, reservaXRP, colateralXRP: Math.max(0, saldoXRP - reservaXRP) }
  }

  async saldoBRL(conta: string): Promise<number> {
    const linhas = await this.client.request({
      command: 'account_lines',
      account: conta,
      peer: this.c.EMISSOR_BRL.address,
      ledger_index: 'validated',
    })
    const linha = linhas.result.lines.find((l) => l.currency === MOEDA_BRL)
    return linha ? Number(linha.balance) : 0
  }

  async saldoMPT(conta: string, emissaoId: string): Promise<number> {
    const objetos = await this.client.request({
      command: 'account_objects',
      account: conta,
      type: 'mptoken',
      ledger_index: 'validated',
    })
    // O tipo MPToken ainda nao esta na uniao de account_objects do pacote xrpl.
    const itens: unknown[] = objetos.result.account_objects
    for (const item of itens) {
      if (item === null || typeof item !== 'object') continue
      const campos = item as Record<string, unknown>
      if (campos.MPTokenIssuanceID === emissaoId) {
        return typeof campos.MPTAmount === 'string' ? Number(campos.MPTAmount) : 0
      }
    }
    return 0
  }
}
