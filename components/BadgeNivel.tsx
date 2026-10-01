import type { NivelCobertura } from '@/lib/domain/credito'
import type { Dicionario } from '@/lib/i18n/dicionario'
import { Badge, type Tom } from './ui/Badge'

export const TOM_NIVEL: Record<NivelCobertura, Tom> = {
  entrada: 'sucesso',
  alerta: 'alerta',
  recomposicao: 'perigo',
  realizacao: 'perigoForte',
}

export function BadgeNivel({ nivel, t }: { nivel: NivelCobertura; t: Dicionario['nivel'] }) {
  return <Badge tom={TOM_NIVEL[nivel]}>{t[nivel]}</Badge>
}
