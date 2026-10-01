import { describe, expect, it } from 'vitest'
import { semDadoPessoal } from '../lib/fenynx/cliente'
import type { EmprestimoApi } from '../lib/fenynx/contrato'
import { cifrar, decifrar } from '../lib/privacidade/cofre'
import { mascararDocumento, mascararNome, pseudonimo } from '../lib/privacidade/pseudonimo'

const SEGREDO = 'segredo-de-teste'
const CHAVE = 'a'.repeat(64)

describe('privacidade', () => {
  it('gera o mesmo codigo para o mesmo documento, com ou sem pontuacao', () => {
    expect(pseudonimo('123.456.789-09', SEGREDO)).toBe(pseudonimo('12345678909', SEGREDO))
    expect(pseudonimo('12345678909', SEGREDO)).toMatch(/^CLI [0-9A-F]{4} [0-9A-F]{4}$/)
  })

  it('muda o codigo quando muda o segredo ou o documento', () => {
    expect(pseudonimo('12345678909', SEGREDO)).not.toBe(pseudonimo('12345678909', 'outro'))
    expect(pseudonimo('12345678909', SEGREDO)).not.toBe(pseudonimo('98765432100', SEGREDO))
  })

  it('mascara nome e documento', () => {
    expect(mascararNome('Maria da Silva')).toBe('M**** d* S****')
    expect(mascararDocumento('123.456.789-09')).toBe('*********09')
  })

  it('cifra e decifra, e recusa texto adulterado', () => {
    const cifrado = cifrar('Maria da Silva', CHAVE)
    expect(cifrado).not.toContain('Maria')
    expect(decifrar(cifrado, CHAVE)).toBe('Maria da Silva')
    const [iv, tag, dados] = cifrado.split('.')
    expect(() => decifrar(`${iv}.${tag}.${dados}AA`, CHAVE)).toThrow()
    expect(() => decifrar(cifrado, 'b'.repeat(64))).toThrow()
  })

  it('tira nome e documento do emprestimo que vem da API', () => {
    const api: EmprestimoApi = {
      id: 'emp_1',
      produto: 'credito',
      ativo: 'BTC',
      garantia_quantidade: 0.05,
      principal_brl: 10000,
      tac_brl: 200,
      taxa_mensal: 0.014,
      prazo_meses: 12,
      saldo_devedor_brl: 10200,
      ltv: 0.5,
      status: 'ativa',
      iniciado_em: '2026-10-01T00:00:00Z',
      tomador: { id: 'u_1', nome: 'Maria da Silva', documento: '123.456.789-09' },
    }
    const limpo = semDadoPessoal(api, SEGREDO)
    const texto = JSON.stringify(limpo)
    expect(texto).not.toContain('Maria')
    expect(texto).not.toContain('123')
    expect(limpo.cliente).toBe(pseudonimo('12345678909', SEGREDO))
  })
})
