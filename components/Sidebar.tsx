'use client'

import { Activity, Layers, LayoutDashboard, Network, Settings, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Ativo } from '@/lib/domain/case'
import type { Dicionario } from '@/lib/i18n/dicionario'
import { IconeAtivo } from './IconeAtivo'
import { Logo } from './Logo'

const ITEM = 'flex h-12 items-center gap-3 rounded-[12px] px-3.5 text-[15px] transition-colors duration-150'
const ATIVO = 'bg-marca-suave font-medium text-marca-escuro'
const INATIVO = 'text-tinta-700 hover:bg-superficie-2'

export function Sidebar({ t }: { t: Dicionario['nav'] }) {
  const caminho = usePathname()
  const noCaminho = (href: string) => (href === '/' ? caminho === '/' : caminho.startsWith(href))
  const principais: { href: string; rotulo: string; icone: LucideIcon }[] = [
    { href: '/', rotulo: t.visao, icone: LayoutDashboard },
    { href: '/monitor', rotulo: t.monitor, icone: Activity },
    { href: '/operacoes', rotulo: t.operacoes, icone: Layers },
  ]
  const garantias: { href: string; rotulo: string; ativo: Ativo }[] = [
    { href: '/garantias/xrp', rotulo: 'XRP', ativo: 'XRP' },
    { href: '/garantias/btc', rotulo: 'Bitcoin', ativo: 'BTC' },
    { href: '/lastro', rotulo: 'TERRE02', ativo: 'MPT' },
  ]
  const sistema: { href: string; rotulo: string; icone: LucideIcon }[] = [
    { href: '/rede', rotulo: t.rede, icone: Network },
    { href: '/config', rotulo: t.config, icone: Settings },
  ]
  const lista = (itens: { href: string; rotulo: string; icone: LucideIcon }[]) =>
    itens.map(({ href, rotulo, icone: Icone }) => (
      <Link key={href} href={href} aria-current={noCaminho(href) ? 'page' : undefined} className={`${ITEM} ${noCaminho(href) ? ATIVO : INATIVO}`}>
        <Icone size={20} strokeWidth={1.75} aria-hidden />
        {rotulo}
      </Link>
    ))
  return (
    <aside className="fixed inset-y-0 left-0 flex w-64 flex-col overflow-y-auto border-r border-borda bg-superficie px-4 py-6">
      <Link href="/" className="px-3">
        <Logo altura={28} />
      </Link>
      <div className="mt-2 px-3 text-[13px] text-tinta-sub">{t.produto}</div>
      <nav className="mt-8 flex flex-col gap-1">
        {lista(principais)}
        <div className="mb-1 mt-6 px-3.5 text-[13px] font-medium text-tinta-sub">{t.garantias}</div>
        {garantias.map(({ href, rotulo, ativo }) => (
          <Link key={href} href={href} aria-current={noCaminho(href) ? 'page' : undefined} className={`${ITEM} ${noCaminho(href) ? ATIVO : INATIVO}`}>
            <IconeAtivo ativo={ativo} tamanho={24} />
            {rotulo}
          </Link>
        ))}
        <div className="mt-6" />
        {lista(sistema)}
      </nav>
    </aside>
  )
}
