import type { Ativo, ClasseToken } from '@/lib/domain/case'
import type { Dicionario } from '@/lib/i18n/dicionario'
import { Badge } from './ui/Badge'

/** Selos que dizem o que e a garantia: padrao do ativo, classe e onde ela fica guardada. */
export function RotulosAtivo({
  ativo,
  t,
  compacto = false,
  classe = 'imovel',
}: {
  ativo: Ativo
  t: Dicionario['rotulos']
  /** Esconde o selo de onde a garantia fica guardada. */
  compacto?: boolean
  classe?: ClasseToken
}) {
  if (ativo === 'CESTA') {
    return (
      <div className="flex flex-wrap gap-1.5">
        <Badge tom="marca">{t.cesta}</Badge>
        <Badge tom="info">{t.veiculo}</Badge>
        <Badge tom="info">{t.recebivel}</Badge>
        <Badge tom="neutro">XRP</Badge>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tom="marca">{ativo}</Badge>
      <Badge tom={ativo === 'MPT' ? 'info' : 'neutro'}>{ativo === 'MPT' ? t[classe] : t.cripto}</Badge>
      {compacto ? null : <Badge tom="neutro">{ativo === 'BTC' ? t.foraXrpl : t.naXrpl}</Badge>}
    </div>
  )
}
