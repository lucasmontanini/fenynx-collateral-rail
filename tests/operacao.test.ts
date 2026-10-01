import { describe, expect, it } from 'vitest'
import { calcularLTV, nivelCobertura } from '../lib/domain/credito'
import { CASE_FENYNX } from '../lib/domain/case'
import { financiar, garantiaNecessaria, montarOperacao, type RegistroDatado } from '../lib/domain/operacao'

const INICIO = '2026-10-01T00:00:00Z'
const DIA = 86_400_000
const agora = (dias: number) => new Date(INICIO).getTime() + dias * DIA

const abertura: RegistroDatado = {
  t: 'abertura',
  produto: 'iphone',
  ativo: 'XRP',
  principal: 11999,
  tac: 599.95,
  taxaMensal: 0.0179,
  meses: 24,
  ltvEntrada: 0.5,
  em: INICIO,
}

describe('regras de credito', () => {
  it('calcula TAC e valor financiado do iPhone', () => {
    expect(financiar(11999, CASE_FENYNX.iphone.tac)).toEqual({ tac: 599.95, financiado: 12598.95 })
  })

  it('exige garantia de duas vezes a divida no LTV de 50%', () => {
    expect(garantiaNecessaria(1000, 10, 0.5)).toBe(200)
  })

  it('classifica os niveis de LTV', () => {
    expect(nivelCobertura(calcularLTV(500, 100, 10), CASE_FENYNX.ltv)).toBe('entrada')
    expect(nivelCobertura(0.65, CASE_FENYNX.ltv)).toBe('alerta')
    expect(nivelCobertura(0.7, CASE_FENYNX.ltv)).toBe('recomposicao')
    expect(nivelCobertura(0.8, CASE_FENYNX.ltv)).toBe('realizacao')
  })
})

describe('estado da operacao', () => {
  it('fica ativa com LTV de entrada e precos de gatilho coerentes', () => {
    const op = montarOperacao('r1', INICIO, [abertura], 3266.24, 7.715, agora(0))
    expect(op?.status).toBe('ativa')
    expect(op?.ltv).toBeCloseTo(0.5, 3)
    expect(op?.precoMargem).toBeCloseTo(12598.95 / (3266.24 * 0.7), 6)
    expect(op?.precoLiquidacao).toBeCloseTo(12598.95 / (3266.24 * 0.8), 6)
  })

  it('aguarda garantia enquanto nada foi travado', () => {
    expect(montarOperacao('r1', INICIO, [abertura], 0, 7.7, agora(0))?.status).toBe('aguardando')
  })

  it('acumula juros de um mes no saldo devedor', () => {
    const op = montarOperacao('r1', INICIO, [abertura], 3266.24, 7.7, agora(30))
    expect(op?.saldoDevedor).toBeCloseTo(12598.95 * 1.0179, 2)
  })

  it('continua liquidada com o passar do tempo', () => {
    const liquidacao: RegistroDatado = { t: 'liquidacao', quantidade: 2799.77, preco: 4.5, valor: 12598.97, em: INICIO }
    const op = montarOperacao('r1', INICIO, [abertura, liquidacao], 0, 7.7, agora(400))
    expect(op?.status).toBe('liquidada')
    expect(op?.saldoDevedor).toBe(0)
    expect(op?.ltv).toBeNull()
  })

  it('soma e subtrai a garantia atestada em Bitcoin', () => {
    const registros: RegistroDatado[] = [
      { ...abertura, ativo: 'BTC' },
      { t: 'garantia', quantidade: 0.05, em: INICIO },
      { t: 'garantia', quantidade: -0.01, em: INICIO },
    ]
    expect(montarOperacao('r1', INICIO, registros, 999, 400000, agora(0))?.garantiaQtd).toBeCloseTo(0.04, 8)
  })

  it('devolve nulo para conta sem registro de abertura', () => {
    expect(montarOperacao('r1', INICIO, [], 40, 7.7, agora(0))).toBeNull()
  })
})
