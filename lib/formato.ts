import { CASAS_ATIVO, type Ativo } from './domain/case'
import type { Idioma } from './i18n/dicionario'

const LOCALE: Record<Idioma, string> = { pt: 'pt-BR', en: 'en-US' }
const EPOCA_RIPPLE = 946684800

export function brl(valor: number, idioma: Idioma): string {
  return new Intl.NumberFormat(LOCALE[idioma], { style: 'currency', currency: 'BRL' }).format(valor)
}

export function numero(valor: number, idioma: Idioma, casas = 2): string {
  return new Intl.NumberFormat(LOCALE[idioma], {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor)
}

export function percentual(valor: number, idioma: Idioma): string {
  if (!Number.isFinite(valor)) return ''
  return new Intl.NumberFormat(LOCALE[idioma], { style: 'percent', maximumFractionDigits: 1 }).format(valor)
}

export function dataHora(iso: string | number, idioma: Idioma): string {
  return new Intl.DateTimeFormat(LOCALE[idioma], {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso))
}

/** Segundos da epoca Ripple para milissegundos Unix. */
export function rippleParaMs(segundos: number): number {
  return (segundos + EPOCA_RIPPLE) * 1000
}

export function encurtar(texto: string, inicio = 6, fim = 4): string {
  return texto.length <= inicio + fim + 1 ? texto : `${texto.slice(0, inicio)}…${texto.slice(-fim)}`
}

/** Quantidade de garantia com as casas do ativo e o simbolo. */
export function quantidade(valor: number, ativo: Ativo, idioma: Idioma, simbolo: string = ativo): string {
  return `${numero(valor, idioma, CASAS_ATIVO[ativo])} ${simbolo}`
}

/** Taxa com duas casas, como 1,79%. */
export function taxa(valor: number, idioma: Idioma): string {
  return new Intl.NumberFormat(LOCALE[idioma], { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor)
}
