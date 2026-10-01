import type { ReactNode } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { Topo } from '@/components/Topo'
import { exigirSessao } from '@/lib/auth/servidor'
import { traducao } from '@/lib/i18n/servidor'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const email = await exigirSessao()
  const { t, idioma } = await traducao()
  const painel = await painelDaRequisicao()
  return (
    <div className="min-h-screen">
      <Sidebar t={t.nav} />
      <div className="pl-64">
        <Topo t={t.nav} idioma={idioma} email={email} precos={painel.precos} />
        <main className="mx-auto max-w-[1360px] px-8 py-10">{children}</main>
      </div>
    </div>
  )
}
