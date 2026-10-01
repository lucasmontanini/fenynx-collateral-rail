'use client'

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface PontoHistorico {
  dia: string
  valor: number
  rotulo: string
}

/** Historico de preco em uma serie, com os precos de gatilho como linhas de referencia. */
export function GraficoPreco({
  pontos,
  gatilhos,
}: {
  pontos: PontoHistorico[]
  gatilhos: { valor: number; rotulo: string }[]
}) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pontos} margin={{ top: 12, right: 196, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="#e9e9ee" vertical={false} />
          <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#6f6f7b' }} axisLine={{ stroke: '#e9e9ee' }} tickLine={false} minTickGap={48} />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 12, fill: '#6f6f7b' }}
            tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)} mil` : v.toFixed(2))}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ stroke: '#9a9aa6', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as PontoHistorico | undefined
              if (!active || !p) return null
              return (
                <div className="rounded-[10px] border border-borda bg-superficie px-3 py-2 text-[13px] shadow-sm">
                  <div className="text-tinta-sub">{p.dia}</div>
                  <div className="tabular text-[15px] font-semibold text-tinta">{p.rotulo}</div>
                </div>
              )
            }}
          />
          {gatilhos.map((g) => (
            <ReferenceLine
              key={g.rotulo}
              y={g.valor}
              ifOverflow="extendDomain"
              stroke="#9a9aa6"
              strokeDasharray="3 3"
              label={{ value: g.rotulo, position: 'right', fontSize: 12, fill: '#6f6f7b' }}
            />
          ))}
          <Line dataKey="valor" stroke="#5c2eea" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#5c2eea', stroke: '#ffffff', strokeWidth: 2 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
