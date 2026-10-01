'use client'

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface PontoGrafico {
  queda: number
  ltv: number
  rotuloQueda: string
  rotuloLtv: string
  emMargem: number
  emLiquidacao: number
}

export interface TextosEstresse {
  quedaDePreco: string
  ltv: string
  emMargem: string
  emLiquidacao: string
}

/** LTV da carteira em funcao da queda de preco. Uma serie, um eixo, gatilhos como linhas de referencia. */
export function GraficoEstresse({
  pontos,
  gatilhos,
  t,
}: {
  pontos: PontoGrafico[]
  gatilhos: { valor: number; rotulo: string }[]
  t: TextosEstresse
}) {
  const maximo = Math.max(100, Math.ceil(Math.max(...pontos.map((p) => p.ltv)) / 20) * 20)
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pontos} margin={{ top: 12, right: 128, bottom: 4, left: 0 }}>
          <CartesianGrid stroke="#e9e9ee" vertical={false} />
          <XAxis
            dataKey="queda"
            type="number"
            domain={[0, 60]}
            ticks={[0, 10, 20, 30, 40, 50, 60]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 12, fill: '#6f6f7b' }}
            axisLine={{ stroke: '#e9e9ee' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, maximo]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 12, fill: '#6f6f7b' }}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ stroke: '#9a9aa6', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as PontoGrafico | undefined
              if (!active || !p) return null
              return (
                <div className="rounded-[10px] border border-borda bg-superficie px-3 py-2 text-[13px] shadow-sm">
                  <div className="text-tinta-sub">
                    {t.quedaDePreco} {p.rotuloQueda}
                  </div>
                  <div className="tabular text-[15px] font-semibold text-tinta">
                    {t.ltv} {p.rotuloLtv}
                  </div>
                  <div className="tabular text-tinta-sub">
                    {p.emMargem} {t.emMargem}
                  </div>
                  <div className="tabular text-tinta-sub">
                    {p.emLiquidacao} {t.emLiquidacao}
                  </div>
                </div>
              )
            }}
          />
          {gatilhos.map((g) => (
            <ReferenceLine
              key={g.rotulo}
              y={g.valor}
              stroke="#9a9aa6"
              strokeDasharray="3 3"
              label={{ value: g.rotulo, position: 'right', fontSize: 12, fill: '#6f6f7b' }}
            />
          ))}
          <Line
            dataKey="ltv"
            stroke="#5c2eea"
            strokeWidth={2}
            dot={{ r: 3, fill: '#5c2eea', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#5c2eea', stroke: '#ffffff', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
