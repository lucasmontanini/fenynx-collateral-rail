import type { NivelCobertura } from '@/lib/domain/credito'

const COR: Record<NivelCobertura, string> = {
  entrada: 'bg-sucesso',
  alerta: 'bg-alerta',
  recomposicao: 'bg-perigo opacity-60',
  realizacao: 'bg-perigo',
}

export interface FaixaNivel {
  nivel: NivelCobertura
  rotulo: string
  faixa: string
  operacoes: number
  valor: number
  texto: string
}

/** Divida por nivel de LTV: uma barra empilhada e a legenda com contagem e valor. */
export function BarraNiveis({ faixas, rotuloOperacoes }: { faixas: FaixaNivel[]; rotuloOperacoes: string }) {
  const total = faixas.reduce((soma, f) => soma + f.valor, 0)
  return (
    <div>
      <div className="flex h-3 gap-[2px] overflow-hidden rounded-full bg-superficie-2">
        {faixas
          .filter((f) => f.valor > 0)
          .map((f) => (
            <div key={f.nivel} className={COR[f.nivel]} style={{ width: `${(f.valor / total) * 100}%` }} />
          ))}
      </div>
      <ul className="mt-5 flex flex-col">
        {faixas.map((f) => (
          <li key={f.nivel} className="flex h-14 items-center justify-between gap-4 border-b border-borda last:border-0">
            <span className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${COR[f.nivel]}`} />
              <span>
                <span className="block text-[15px] leading-tight text-tinta">{f.rotulo}</span>
                <span className="tabular block text-[13px] text-tinta-sub">
                  LTV {f.faixa} · {f.operacoes} {rotuloOperacoes}
                </span>
              </span>
            </span>
            <span className="tabular text-[15px] font-medium text-tinta">{f.texto}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
