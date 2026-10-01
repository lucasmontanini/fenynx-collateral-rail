import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { CASE_FENYNX } from '@/lib/domain/case'
import type { NivelCobertura } from '@/lib/domain/credito'
import type { Operacao } from '@/lib/domain/operacao'
import { brl, encurtar, percentual, quantidade } from '@/lib/formato'
import type { Dicionario, Idioma } from '@/lib/i18n/dicionario'
import { BadgeNivel } from './BadgeNivel'
import { BadgeStatus } from './BadgeStatus'
import { IconeAtivo } from './IconeAtivo'
import { RotulosAtivo } from './RotulosAtivo'
import { Medidor } from './ui/Medidor'

const FAIXA: Record<NivelCobertura, string> = {
  entrada: 'bg-sucesso',
  alerta: 'bg-alerta',
  recomposicao: 'bg-perigo',
  realizacao: 'bg-perigo',
}

/** Cartao de monitoramento de uma operacao: saude, LTV, garantia e distancia ate a margem. */
export function CardGarantia({ op, t, idioma }: { op: Operacao; t: Dicionario; idioma: Idioma }) {
  const tom = op.nivel === 'entrada' ? 'sucesso' : op.nivel === 'alerta' ? 'alerta' : 'perigo'
  const marcadores = (['alerta', 'recomposicao', 'realizacao'] as const).map((n) => ({
    posicao: CASE_FENYNX.ltv[n],
    rotulo: percentual(CASE_FENYNX.ltv[n], idioma),
  }))
  const dado = 'text-[13px] text-tinta-sub'
  const valor = 'tabular text-[15px] font-medium text-tinta'
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-cartao border border-borda bg-superficie shadow-cartao transition-shadow duration-150 hover:shadow-md">
      <div className={`h-1.5 ${op.nivel ? FAIXA[op.nivel] : 'bg-borda-forte'}`} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <IconeAtivo ativo={op.ativo} tamanho={46} />
            <div className="min-w-0">
            <div className="truncate text-[16px] font-semibold text-tinta">{op.modelo ?? t.produto[op.produto]}</div>
            <div className="tabular text-[13px] text-tinta-sub">
              {op.simbolo} · {encurtar(op.conta, 5, 4)}
              </div>
            </div>
          </div>
          {op.nivel ? <BadgeNivel nivel={op.nivel} t={t.nivel} /> : <BadgeStatus status={op.status} t={t.status} />}
        </div>

        <div className="mt-3">
          <RotulosAtivo ativo={op.ativo} t={t.rotulos} />
        </div>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="tabular text-[40px] font-semibold leading-none tracking-tight text-tinta">
            {op.ltv !== null ? percentual(op.ltv, idioma) : '0%'}
          </span>
          <span className="text-[14px] text-tinta-sub">LTV</span>
        </div>
        <div className="mt-3">
          <Medidor valor={op.ltv ?? 0} tom={tom} marcadores={marcadores} rotulo="LTV" />
        </div>

        <dl className="mb-5 mt-2 grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <dt className={dado}>{t.monitor.garantia}</dt>
            <dd className={valor}>{quantidade(op.garantiaQtd, op.ativo, idioma, op.simbolo)}</dd>
            <dd className="tabular text-[13px] text-tinta-sub">{op.garantiaBRL !== null ? brl(op.garantiaBRL, idioma) : ''}</dd>
          </div>
          <div>
            <dt className={dado}>{t.monitor.divida}</dt>
            <dd className={valor}>{brl(op.saldoDevedor, idioma)}</dd>
          </div>
          <div>
            <dt className={dado}>{t.monitor.precoAtual}</dt>
            <dd className={valor}>{op.precoAtual !== null ? brl(op.precoAtual, idioma) : ''}</dd>
            <dd className="tabular text-[13px] text-tinta-sub">
              {op.precoMargem !== null ? `${t.monitor.margemEm} ${brl(op.precoMargem, idioma)}` : ''}
            </dd>
          </div>
          <div>
            <dt className={dado}>{t.monitor.folga}</dt>
            <dd className={valor}>
              {op.folgaMargem !== null && op.folgaMargem > 0 ? percentual(op.folgaMargem, idioma) : t.monitor.semFolga}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-borda pt-4">
          <Link
            href={`/operacoes/${op.conta}`}
            className="inline-flex items-center gap-1 text-[14px] font-medium text-marca hover:text-marca-escuro"
          >
            {t.monitor.abrir}
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </Link>
          {op.ativo === 'MPT' ? (
            <Link
              href="/lastro"
              className="inline-flex h-8 items-center rounded-[8px] bg-marca px-3 text-[13px] font-semibold text-white hover:bg-marca-escuro"
            >
              {t.lastro.verLastro}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  )
}
