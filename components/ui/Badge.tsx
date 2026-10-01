import type { ReactNode } from 'react'

export type Tom = 'neutro' | 'marca' | 'sucesso' | 'alerta' | 'perigo' | 'perigoForte' | 'info'

const ESTILO: Record<Tom, string> = {
  neutro: 'bg-superficie-2 text-tinta-700',
  marca: 'bg-marca-suave text-marca-escuro',
  sucesso: 'bg-sucesso-suave text-sucesso',
  alerta: 'bg-alerta-suave text-alerta',
  perigo: 'bg-perigo-suave text-perigo',
  perigoForte: 'bg-perigo text-white',
  info: 'bg-info-suave text-info',
}

export function Badge({ tom = 'neutro', children }: { tom?: Tom; children: ReactNode }) {
  return (
    <span
      className={`inline-flex h-7 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-medium ${ESTILO[tom]}`}
    >
      {children}
    </span>
  )
}
