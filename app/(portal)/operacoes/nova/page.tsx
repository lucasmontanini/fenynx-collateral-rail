import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { FormNovaOperacao } from '@/components/FormNovaOperacao'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { TOKEN_TERRE02 } from '@/lib/domain/case'
import { traducao } from '@/lib/i18n/servidor'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'

export default async function NovaOperacao() {
  const { t, idioma } = await traducao()
  const { precos } = await painelDaRequisicao()
  return (
    <>
      <Link href="/operacoes" className="mb-4 inline-flex items-center gap-1 text-[14px] text-tinta-sub hover:text-tinta">
        <ChevronLeft size={15} strokeWidth={1.75} aria-hidden />
        {t.operacao.voltar}
      </Link>
      <SectionHeader titulo={t.nova.titulo} subtitulo={t.nova.subtitulo} />
      <FormNovaOperacao
        precos={{ XRP: precos.XRP?.valor ?? null, BTC: precos.BTC?.valor ?? null, MPT: TOKEN_TERRE02.valorUnitario, CESTA: null }}
        t={t}
        idioma={idioma}
      />
    </>
  )
}
