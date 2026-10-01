export type NivelCobertura = 'entrada' | 'alerta' | 'recomposicao' | 'realizacao'

/** Gatilhos de LTV. Percentuais de teste, a politica de risco define os definitivos. */
export interface PoliticaLTV {
  entrada: number
  alerta: number
  recomposicao: number
  realizacao: number
}

export const POLITICA_TESTE: PoliticaLTV = {
  entrada: 0.5,
  alerta: 0.6,
  recomposicao: 0.7,
  realizacao: 0.8,
}

/** LTV = saldo devedor dividido pelo valor elegivel da garantia, tudo em reais. */
export function calcularLTV(
  saldoDevedorBRL: number,
  quantidadeColateral: number,
  precoBRL: number,
  haircut = 0,
): number {
  const valorElegivel = quantidadeColateral * precoBRL * (1 - haircut)
  if (valorElegivel <= 0) return Number.POSITIVE_INFINITY
  return saldoDevedorBRL / valorElegivel
}

export function nivelCobertura(ltv: number, politica: PoliticaLTV = POLITICA_TESTE): NivelCobertura {
  if (ltv >= politica.realizacao) return 'realizacao'
  if (ltv >= politica.recomposicao) return 'recomposicao'
  if (ltv >= politica.alerta) return 'alerta'
  return 'entrada'
}

/**
 * Quanto do colateral pode ser liberado depois de uma amortizacao,
 * mantendo o LTV de entrada sobre o saldo que resta.
 */
export function colateralLiberavel(
  colateralTravado: number,
  saldoDevedorBRL: number,
  precoBRL: number,
  politica: PoliticaLTV = POLITICA_TESTE,
): number {
  const necessario = saldoDevedorBRL / (precoBRL * politica.entrada)
  return Math.max(0, colateralTravado - necessario)
}
