import { describe, expect, it } from 'vitest'
import { curvaDeEstresse, resumirCarteira } from '../lib/domain/carteira'
import { montarOperacao, type Operacao, type RegistroDatado } from '../lib/domain/operacao'

const INICIO = '2026-10-01T00:00:00Z'
const AGORA = new Date(INICIO).getTime()

function operacao(conta: string, ativo: 'XRP' | 'MPT', principal: number, garantia: number, preco: number): Operacao {
  const abertura: RegistroDatado = {
    t: 'abertura',
    produto: 'credito',
    ativo,
    principal,
    tac: 0,
    taxaMensal: 0.014,
    meses: 12,
    ltvEntrada: 0.5,
    em: INICIO,
    ...(ativo === 'MPT' ? { token: { ticker: 'TERRE02', emissaoId: 'x', valorUnitario: preco } } : {}),
  }
  const op = montarOperacao(conta, INICIO, [abertura], garantia, ativo === 'MPT' ? null : preco, AGORA)
  if (!op) throw new Error('operacao invalida')
  return op
}

describe('carteira', () => {
  const xrp = operacao('rA', 'XRP', 1000, 200, 10) // LTV 50%
  const token = operacao('rB', 'MPT', 1000, 2000, 1) // LTV 50%

  it('usa o valor de referencia do token como preco', () => {
    expect(token.simbolo).toBe('TERRE02')
    expect(token.garantiaBRL).toBe(2000)
    expect(token.ltv).toBeCloseTo(0.5, 6)
  })

  it('resume garantia, divida e LTV', () => {
    const resumo = resumirCarteira([xrp, token])
    expect(resumo.ativas).toBe(2)
    expect(resumo.garantiaBRL).toBe(4000)
    expect(resumo.ltv).toBeCloseTo(0.5, 6)
    expect(resumo.porNivel.entrada.operacoes).toBe(2)
    expect(resumo.menorFolga?.folga).toBeCloseTo(1 - 0.5 / 0.7, 6)
  })

  it('aplica o choque so nos criptoativos', () => {
    const curva = curvaDeEstresse([xrp, token])
    const metade = curva.find((p) => Math.abs(p.queda - 0.5) < 1e-9)
    // XRP cai para 1000 de garantia, token continua em 2000.
    expect(metade?.ltv).toBeCloseTo(2000 / 3000, 6)
    expect(metade?.emLiquidacao).toBe(1)
    expect(curva[0]?.emLiquidacao).toBe(0)
  })
})
