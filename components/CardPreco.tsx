import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Badge, type Tom } from './ui/Badge'

/** Cartao de preco de um ativo em garantia: identidade, valor, origem do valor e atalho. */
export function CardPreco({
  icone,
  simbolo,
  nome,
  rotulos,
  valor,
  origem,
  tomOrigem,
  apoio,
  grafico,
  fonte,
  link,
}: {
  icone: ReactNode
  simbolo: string
  nome: string
  rotulos: ReactNode
  valor: string
  /** De onde vem o valor: mercado, simulado ou avaliacao. */
  origem: string
  tomOrigem: Tom
  apoio?: string
  grafico?: ReactNode
  fonte: string
  link: { href: string; rotulo: string }
}) {
  return (
    <article className="flex h-full flex-col rounded-cartao border border-borda bg-superficie p-6 shadow-cartao">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          {icone}
          <div className="min-w-0">
            <div className="text-[19px] font-semibold leading-tight text-tinta">{simbolo}</div>
            <div className="truncate text-[14px] text-tinta-sub">{nome}</div>
          </div>
        </div>
        <Badge tom={tomOrigem}>{origem}</Badge>
      </div>
      <div className="mt-4">{rotulos}</div>
      <div className="tabular mt-5 text-[30px] font-semibold leading-none tracking-tight text-tinta">{valor}</div>
      <div className="tabular mt-1.5 min-h-5 text-[14px] text-tinta-sub">{apoio}</div>
      <div className="mt-3 flex h-12 items-center">{grafico}</div>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-borda pt-4">
        <span className="text-[13px] leading-snug text-tinta-sub">{fonte}</span>
        <Link
          href={link.href}
          className="inline-flex shrink-0 items-center gap-1 text-[14px] font-medium text-marca hover:text-marca-escuro"
        >
          {link.rotulo}
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
    </article>
  )
}
