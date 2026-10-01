import type { Dicionario } from '@/lib/i18n/dicionario'
import type { StatusOperacao } from '@/lib/domain/operacao'
import { Badge, type Tom } from './ui/Badge'

const TOM: Record<StatusOperacao, Tom> = {
  aguardando: 'neutro',
  ativa: 'marca',
  quitada: 'sucesso',
  liquidada: 'perigo',
}

export function BadgeStatus({ status, t }: { status: StatusOperacao; t: Dicionario['status'] }) {
  return <Badge tom={TOM[status]}>{t[status]}</Badge>
}
