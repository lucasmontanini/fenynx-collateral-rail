'use client'

import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface BarraCobertura {
  conta: string
  ltv: number
  nivel: string
  cor: string
  rotulo: string
}

export interface Gatilho {
  valor: number
  rotulo: string
}

/** LTV de cada operacao ativa contra os gatilhos da politica. Um eixo, barras finas. */
export function GraficoCobertura({ barras, gatilhos }: { barras: BarraCobertura[]; gatilhos: Gatilho[] }) {
  const maximo = Math.max(100, ...barras.map((b) => Math.ceil(b.ltv / 10) * 10 + 10))
  return (
    <div style={{ height: Math.max(150, barras.length * 44 + 56) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={barras} layout="vertical" margin={{ top: 22, right: 56, bottom: 0, left: 8 }} barCategoryGap={14}>
          <XAxis
            type="number"
            domain={[0, maximo]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 12, fill: '#6f6f7b' }}
            axisLine={{ stroke: '#e9e9ee' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="conta"
            width={96}
            tick={{ fontSize: 13, fill: '#3d3d47' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: '#f4f4f6' }}
            content={({ active, payload }) => {
              const item = payload?.[0]?.payload as BarraCobertura | undefined
              if (!active || !item) return null
              return (
                <div className="rounded-[10px] border border-borda bg-superficie px-3 py-2 text-[13px] shadow-sm">
                  <div className="font-medium text-tinta">{item.conta}</div>
                  <div className="tabular text-tinta-sub">
                    {item.rotulo} · {item.nivel}
                  </div>
                </div>
              )
            }}
          />
          {gatilhos.map((g) => (
            <ReferenceLine
              key={g.rotulo}
              x={g.valor}
              stroke="#9a9aa6"
              strokeDasharray="3 3"
              label={{ value: g.rotulo, position: 'top', fontSize: 12, fill: '#6f6f7b' }}
            />
          ))}
          <Bar dataKey="ltv" barSize={14} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {barras.map((b) => (
              <Cell key={b.conta} fill={b.cor} />
            ))}
            <LabelList dataKey="rotulo" position="right" style={{ fontSize: 13, fill: '#16161c', fontWeight: 500, stroke: '#ffffff', strokeWidth: 3, paintOrder: 'stroke' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
