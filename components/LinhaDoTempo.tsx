import { dataHora, encurtar } from '@/lib/formato'
import type { Dicionario, Idioma } from '@/lib/i18n/dicionario'
import type { Evento } from '@/lib/xrpl/leitura'
import { LinkExterno } from './LinkExterno'

export function LinhaDoTempo({
  eventos,
  explorer,
  t,
  idioma,
}: {
  eventos: Evento[]
  explorer: string
  t: Dicionario['evento']
  idioma: Idioma
}) {
  return (
    <ol className="relative ml-1.5 border-l border-borda">
      {eventos.map((e) => (
        <li key={e.hash} className="relative pb-5 pl-6 last:pb-0">
          <span
            className={`absolute left-[-5px] top-1.5 h-[9px] w-[9px] rounded-full ring-2 ring-superficie ${
              e.tipo === 'configuracao' || e.tipo === 'outro' || e.tipo === 'abertura' ? 'bg-borda-forte' : 'bg-marca'
            }`}
          />
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-[15px] text-tinta">{t[e.tipo]}</div>
            <div className="tabular shrink-0 text-[13px] text-tinta-sub">{e.data ? dataHora(e.data, idioma) : ''}</div>
          </div>
          {e.detalhe ? <div className="tabular text-[15px] font-medium text-tinta">{e.detalhe}</div> : null}
          <div className="mt-0.5 flex items-center gap-2 text-[13px] text-tinta-sub">
            <span>{e.transacao}</span>
            <LinkExterno href={`${explorer}/transactions/${e.hash}`}>{encurtar(e.hash, 8, 6)}</LinkExterno>
          </div>
        </li>
      ))}
    </ol>
  )
}
