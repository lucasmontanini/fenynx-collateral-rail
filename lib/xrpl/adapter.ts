import type { Recibo } from './tx'

export interface ParametrosVault {
  /** Janela em que o vault aceita depositos. */
  captacaoSegundos: number
  /** Periodo de investimento, do fim da captacao ate a data de resgate. Minimo de 180. */
  investimentoSegundos: number
}

export interface ParametrosBroker {
  /** Em decimos de ponto base. 1000 equivale a 1 por cento ao ano. */
  managementFeeRate: number
  debtMaximum: string
  /** Em decimos de ponto base. 10000 equivale a 10 por cento. */
  coverRateMinimum: number
  coverRateLiquidation: number
}

export interface TermosEmprestimo {
  principalBRL: string
  /** Taxa anual em decimos de ponto base. 24000 equivale a 24 por cento ao ano. */
  taxaAnual: number
  parcelas: number
  intervaloSegundos: number
  carenciaSegundos: number
  taxaOriginacaoBRL: string
}

/** parcela paga o valor periodico, atraso paga depois do vencimento, quitacao encerra antes do prazo. */
export type ModoPagamento = 'parcela' | 'atraso' | 'quitacao'

export interface EstadoEmprestimo {
  id: string
  tomador: string
  principalEmAberto: number
  valorTotalEmAberto: number
  parcelaPeriodica: number
  parcelasRestantes: number
  proximoVencimento: number
  carencia: number
  inadimplente: boolean
}

export interface EstadoVault {
  id: string
  ativosTotais: number
  ativosDisponiveis: number
  perdaNaoRealizada: number
}

export interface EstadoBroker {
  id: string
  dividaTotal: number
  coverDisponivel: number
}

export interface EstadoGarantia {
  conta: string
  saldoXRP: number
  reservaXRP: number
  /** Saldo menos a reserva exigida pelo ledger. */
  colateralXRP: number
}

/**
 * Tudo que a aplicacao precisa do ledger. A UI e as server actions falam com esta
 * interface e nunca com o pacote xrpl.
 */
export interface LedgerAdapter {
  // Stablecoin de real
  prepararMoeda(): Promise<Recibo[]>
  emitirBRL(destino: string, valor: string): Promise<Recibo>

  // Funding. XLS 65 e XLS 66
  criarVault(p: ParametrosVault): Promise<{ vaultId: string; fimCaptacao: number; recibo: Recibo }>
  registrarBroker(vaultId: string, p: ParametrosBroker): Promise<{ brokerId: string; recibo: Recibo }>
  depositarCover(brokerId: string, valorBRL: string): Promise<Recibo>
  depositarNoVault(vaultId: string, valorBRL: string): Promise<Recibo>
  declararInadimplencia(loanId: string): Promise<Recibo>

  // Conta da operacao. Multisig Fenynx mais agente de garantia.
  // Ela guarda o colateral e e a tomadora on chain, porque so o tomador pode pagar o emprestimo.
  abrirContaOperacao(): Promise<{ conta: string; recibos: Recibo[] }>
  emitirEmprestimo(
    brokerId: string,
    conta: string,
    t: TermosEmprestimo,
  ): Promise<{ loanId: string; recibo: Recibo }>
  desembolsar(conta: string, valorBRL: string): Promise<Recibo>
  aportarPagamento(conta: string, valorBRL: string): Promise<Recibo>
  pagarEmprestimo(conta: string, loanId: string, modo: ModoPagamento, valorBRL?: string): Promise<{ valorPago: string; recibo: Recibo }>

  // Trilho de garantia
  travarColateralXRP(conta: string, quantidadeXRP: string): Promise<Recibo>
  liberarColateralXRP(conta: string, quantidadeXRP: string): Promise<Recibo>
  liquidarColateralXRP(
    conta: string,
    dividaBRL: string,
  ): Promise<{ xrpVendido: number; brlObtido: number; recibo: Recibo }>
  emitirTokenColateral(quantidade: string): Promise<{ emissaoId: string; recibos: Recibo[] }>
  travarColateralMPT(conta: string, emissaoId: string, quantidade: string): Promise<Recibo[]>
  liberarColateralMPT(conta: string, emissaoId: string, quantidade: string): Promise<Recibo>

  // Leitura
  estadoEmprestimo(loanId: string): Promise<EstadoEmprestimo>
  estadoVault(vaultId: string): Promise<EstadoVault>
  estadoBroker(brokerId: string): Promise<EstadoBroker>
  estadoGarantia(conta: string): Promise<EstadoGarantia>
  saldoBRL(conta: string): Promise<number>
  saldoMPT(conta: string, emissaoId: string): Promise<number>
}
