export interface Marcador {
  posicao: number
  rotulo: string
}

const COR = {
  marca: 'bg-marca',
  sucesso: 'bg-sucesso',
  alerta: 'bg-alerta',
  perigo: 'bg-perigo',
} as const

/** Barra de progresso com marcadores de gatilho. valor e posicao entre 0 e 1. */
export function Medidor({
  valor,
  tom = 'marca',
  marcadores = [],
  rotulo,
}: {
  valor: number
  tom?: keyof typeof COR
  marcadores?: Marcador[]
  rotulo: string
}) {
  const largura = Math.max(0, Math.min(1, Number.isFinite(valor) ? valor : 1)) * 100
  return (
    <div className={marcadores.length > 0 ? 'pb-7' : ''}>
      <div
        className="relative h-3 rounded-full bg-superficie-2"
        role="meter"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(largura)}
      >
        <div className={`h-full rounded-full ${COR[tom]}`} style={{ width: `${largura}%` }} />
        {marcadores.map((m) => (
          <div key={m.rotulo} className="absolute top-[-3px]" style={{ left: `${m.posicao * 100}%` }}>
            <div className="h-4 w-px bg-tinta-suave" />
            <div className="tabular absolute left-0 top-5 -translate-x-1/2 whitespace-nowrap text-[12px] text-tinta-sub">
              {m.rotulo}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
