import { Plus } from 'lucide-react'
import { BotaoLink } from '@/components/BotaoLink'
import { TabelaOperacoes } from '@/components/TabelaOperacoes'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { traducao } from '@/lib/i18n/servidor'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'

export default async function Operacoes() {
  const { t, idioma } = await traducao()
  const painel = await painelDaRequisicao()
  return (
    <>
      <SectionHeader
        titulo={t.operacoes.titulo}
        subtitulo={t.operacoes.subtitulo}
        acao={
          <BotaoLink href="/operacoes/nova">
            <Plus size={16} strokeWidth={2} aria-hidden />
            {t.operacoes.nova}
          </BotaoLink>
        }
      />
      <Card>
        <TabelaOperacoes operacoes={painel.operacoes} t={t} idioma={idioma} />
      </Card>
    </>
  )
}
