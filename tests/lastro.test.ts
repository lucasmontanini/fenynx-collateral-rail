import { describe, expect, it } from 'vitest'
import { ATESTADO_DOCUMENTOS, parcelasVencidas, scoreDoLastro } from '../lib/domain/lastro'

const em = (iso: string) => new Date(iso).getTime()

describe('score do lastro', () => {
  it('da 80 para o retrato dos documentos em outubro de 2026', () => {
    const score = scoreDoLastro(ATESTADO_DOCUMENTOS, em('2026-10-01T12:00:00-03:00'))
    // obra 22,75 + absorcao 17,04 + preco 20 + pagamentos 20 + prazo 0
    expect(score.total).toBe(80)
    expect(score.faixa).toBe('saudavel')
    expect(score.componentes.find((c) => c.chave === 'prazo')?.nota).toBe(0)
  })

  it('conta as parcelas vencidas pelo cronograma', () => {
    expect(parcelasVencidas(em('2026-10-20T12:00:00-03:00'))).toBe(0)
    expect(parcelasVencidas(em('2026-10-22T12:00:00-03:00'))).toBe(1)
    expect(parcelasVencidas(em('2027-10-01T12:00:00-03:00'))).toBe(12)
  })

  it('cai quando a divida atrasa e o anuncio some', () => {
    const score = scoreDoLastro(
      { ...ATESTADO_DOCUMENTOS, precoAnuncio: null, areaAnuncioM2: null, parcelasPagas: 0 },
      em('2026-12-22T12:00:00-03:00'),
    )
    // pagamentos zera (3 vencidas, 0 pagas) e preco fica neutro em 10 pontos
    expect(score.total).toBe(50)
    expect(score.faixa).toBe('atencao')
  })
})
