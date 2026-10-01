import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { brl, encurtar, percentual, quantidade } from '@/lib/formato'
import type { Operacao } from '@/lib/domain/operacao'
import type { Dicionario, Idioma } from '@/lib/i18n/dicionario'
import { BadgeNivel } from './BadgeNivel'
import { BadgeStatus } from './BadgeStatus'
import { IconeAtivo } from './IconeAtivo'

export function TabelaOperacoes({
  operacoes,
  t,
  idioma,
}: {
  operacoes: Operacao[]
  t: Dicionario
  idioma: Idioma
}) {
  if (operacoes.length === 0) {
    return <p className="py-6 text-[15px] text-tinta-sub">{t.operacoes.vazia}</p>
  }
  const th = 'pb-3 text-left text-[13px] font-medium text-tinta-sub'
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b border-borda">
          <th className={th}>{t.operacoes.conta}</th>
          <th className={th}>{t.operacoes.produto}</th>
          <th className={`${th} text-right`}>{t.operacoes.garantia}</th>
          <th className={`${th} text-right`}>{t.operacoes.divida}</th>
          <th className={`${th} pl-8`}>{t.operacoes.ltv}</th>
          <th className={th}>{t.operacoes.status}</th>
          <th className={th} />
        </tr>
      </thead>
      <tbody>
        {operacoes.map((o) => (
          <tr key={o.conta} className="h-[72px] border-b border-borda last:border-0">
            <td className="tabular text-[15px] font-medium text-tinta">
              <span className="flex items-center gap-3">
                <IconeAtivo ativo={o.ativo} tamanho={30} />
                <span>
                  {o.origem === 'ledger' ? encurtar(o.conta) : t.cliente.origemApi}
                  {o.cliente ? <span className="block text-[13px] font-normal text-tinta-sub">{o.cliente}</span> : null}
                </span>
              </span>
            </td>
            <td className="text-[15px] text-tinta-700">{o.modelo ?? t.produto[o.produto]}</td>
            <td className="text-right">
              <div className="tabular text-[15px] text-tinta">{quantidade(o.garantiaQtd, o.ativo, idioma, o.simbolo)}</div>
              <div className="tabular text-[13px] text-tinta-sub">
                {o.garantiaBRL !== null ? brl(o.garantiaBRL, idioma) : ''}
              </div>
            </td>
            <td className="tabular text-right text-[15px] text-tinta">{brl(o.saldoDevedor, idioma)}</td>
            <td className="pl-8">
              {o.ltv !== null && o.nivel ? (
                <span className="flex items-center gap-2">
                  <span className="tabular w-14 text-[15px] font-medium text-tinta">{percentual(o.ltv, idioma)}</span>
                  <BadgeNivel nivel={o.nivel} t={t.nivel} />
                </span>
              ) : null}
            </td>
            <td>
              <BadgeStatus status={o.status} t={t.status} />
            </td>
            <td className="text-right">
              {o.origem === 'ledger' ? (
              <Link
                href={`/operacoes/${o.conta}`}
                className="inline-flex items-center gap-1 text-[14px] font-medium text-marca hover:text-marca-escuro"
              >
                {t.operacoes.abrir}
                <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
              </Link>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
