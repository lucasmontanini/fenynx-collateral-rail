import { cookies } from 'next/headers'
import { DICIONARIOS, IDIOMA_PADRAO, type Dicionario, type Idioma } from './dicionario'

export const COOKIE_IDIOMA = 'fx_idioma'

export async function idiomaAtual(): Promise<Idioma> {
  const valor = (await cookies()).get(COOKIE_IDIOMA)?.value
  return valor === 'en' || valor === 'pt' ? valor : IDIOMA_PADRAO
}

export async function traducao(): Promise<{ idioma: Idioma; t: Dicionario }> {
  const idioma = await idiomaAtual()
  return { idioma, t: DICIONARIOS[idioma] }
}
