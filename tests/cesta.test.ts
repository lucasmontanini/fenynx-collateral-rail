import { describe, expect, it } from 'vitest'
import { curvaDeEstresse, resumirCarteira } from '../lib/domain/carteira'
import { montarOperacao, type RegistroDatado, type SaldosCesta } from '../lib/domain/operacao'

const INICIO = '2026-10-01T00:00:00Z'
const AGORA = new Date(INICIO).getTime()

const abertura: RegistroDatado = {
  t: 'abertura',
  produto: 'leasing',
  ativo: 'CESTA',
  principal: 90000,
  tac: 0,
  taxaMensal: 0,
  meses: 11.2,
  ltvEntrada: 0.5,
  credora: 'Eos Loan',
  tomadora: 'Transportadora Brummel',
  cesta: [
    { k: 'MPT', ticker: 'BRMC01', emissaoId: 'cam', valorUnitario: 90000, classe: 'veiculo', h: 0 },
    { k: 'MPT', ticker: 'BRMR01', emissaoId: 'rec', valorUnitario: 1, classe: 'recebivel', h: 0 },
    { k: 'XRP', h: 0 },
  ],
  em: INICIO,
}
const saldos = (recebivel = 90000): SaldosCesta => ({ xrp: 1000, tokens: { cam: 1, rec: recebivel }, precoXRP: 9 })

describe('cesta de garantias', () => {
  it('soma as tres garantias no LTV', () => {
    const op = montarOperacao('r1', INICIO, [abertura], 0, null, AGORA, saldos())
    expect(op?.itens?.map((i) => i.valorElegivel)).toEqual([90000, 90000, 9000])
    expect(op?.garantiaBRL).toBe(189000)
    expect(op?.ltv).toBeCloseTo(90000 / 189000, 6)
    expect(op?.nivel).toBe('entrada')
    expect(op?.credora).toBe('Eos Loan')
  })

  it('aplica o haircut de cada garantia no valor elegivel', () => {
    const comHaircut: RegistroDatado = {
      ...abertura,
      cesta: [
        { k: 'MPT', ticker: 'BRMC01', emissaoId: 'cam', valorUnitario: 90000, classe: 'veiculo', h: 0.3 },
        { k: 'MPT', ticker: 'BRMR01', emissaoId: 'rec', valorUnitario: 1, classe: 'recebivel', h: 0.2 },
        { k: 'XRP', h: 0 },
      ],
    }
    const op = montarOperacao('r1', INICIO, [comHaircut], 0, null, AGORA, saldos())
    expect(op?.garantiaBRL).toBe(63000 + 72000 + 9000)
    expect(op?.ltv).toBeCloseTo(0.625, 6)
    expect(op?.nivel).toBe('alerta')
  })

  it('reavalia so o caminhao e reduz divida e recebivel na parcela', () => {
    const registros: RegistroDatado[] = [
      abertura,
      { t: 'avaliacao', valorUnitario: 60000, ticker: 'BRMC01', em: INICIO },
      { t: 'pagamento', valor: 1875, em: INICIO },
    ]
    const op = montarOperacao('r1', INICIO, registros, 0, null, AGORA, saldos(88125))
    expect(op?.saldoDevedor).toBe(88125)
    expect(op?.itens?.[0]?.valorElegivel).toBe(60000)
    expect(op?.itens?.[1]?.valorElegivel).toBe(88125)
  })

  it('no estresse so a parte em XRP da cesta cai', () => {
    const op = montarOperacao('r1', INICIO, [abertura], 0, null, AGORA, saldos())
    if (!op) throw new Error('operacao invalida')
    const metade = curvaDeEstresse([op]).find((p) => Math.abs(p.queda - 0.5) < 1e-9)
    expect(metade?.ltv).toBeCloseTo(90000 / (180000 + 4500), 6)
    expect(resumirCarteira([op]).porAtivo.map((a) => a.simbolo).sort()).toEqual(['BRMC01', 'BRMR01', 'XRP'])
  })
})
