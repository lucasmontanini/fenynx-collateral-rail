import { ArrowRight, MapPinned } from 'lucide-react'
import Link from 'next/link'
import { LASTRO_TERRE02, type Score } from '@/lib/domain/lastro'
import { percentual } from '@/lib/formato'
import type { Dicionario, Idioma } from '@/lib/i18n/dicionario'
import { LogoZuvia } from './LogoZuvia'
import { Badge, type Tom } from './ui/Badge'

const TOM: Record<Score['faixa'], Tom> = { saudavel: 'sucesso', atencao: 'alerta', risco: 'perigo' }

/** Chamada em destaque para o lastro do token, na operacao garantida por ele. */
export function DestaqueLastro({
  score,
  obra,
  t,
  idioma,
}: {
  score: Score
  obra: number
  t: Dicionario['lastro']
  idioma: Idioma
}) {
  const { empreendimento, titulo } = LASTRO_TERRE02
  return (
    <section className="mb-5 flex items-center justify-between gap-8 rounded-cartao border-2 border-marca bg-superficie p-6">
      <div className="flex items-center gap-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-marca-suave text-marca">
          <MapPinned size={22} strokeWidth={1.75} aria-hidden />
        </span>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[19px] font-semibold text-tinta">{t.destaqueTitulo}</h2>
            <Badge tom={TOM[score.faixa]}>{`${t.score} ${score.total} · ${t.faixa[score.faixa]}`}</Badge>
          </div>
          <div className="mt-2">
            <LogoZuvia altura={20} />
          </div>
          <p className="mt-2 text-[15px] text-tinta-sub">
            {empreendimento.nome}, {empreendimento.cidade} · {titulo.devedora} · {t.obraGeral} {percentual(obra, idioma)}
          </p>
        </div>
      </div>
      <Link
        href="/lastro"
        className="inline-flex h-12 shrink-0 items-center gap-2 rounded-[12px] bg-marca px-6 text-[16px] font-semibold text-white transition-colors duration-150 hover:bg-marca-escuro"
      >
        {t.verLastro}
        <ArrowRight size={18} strokeWidth={2} aria-hidden />
      </Link>
    </section>
  )
}
