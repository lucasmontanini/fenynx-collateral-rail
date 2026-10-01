import type { ReactNode } from 'react'

export interface BarraValor {
  rotulo: string
  icone?: ReactNode
  valor: number
  texto: string
  apoio?: string
}

/** Barras horizontais de magnitude em uma unica cor, com o valor escrito ao lado. */
export function BarrasValor({ barras }: { barras: BarraValor[] }) {
  const maximo = Math.max(1, ...barras.map((b) => b.valor))
  return (
    <div className="flex flex-col gap-4">
      {barras.map((b) => (
        <div key={b.rotulo}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="flex items-center gap-2.5 text-[14px] text-tinta-700">
              {b.icone}
              {b.rotulo}
              {b.apoio ? <span className="ml-2 text-[13px] text-tinta-sub">{b.apoio}</span> : null}
            </span>
            <span className="tabular text-[14px] font-medium text-tinta">{b.texto}</span>
          </div>
          <div className="h-2.5 rounded-full bg-superficie-2">
            <div className="h-full rounded-full bg-marca" style={{ width: `${Math.max(2, (b.valor / maximo) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
