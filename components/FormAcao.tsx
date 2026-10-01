'use client'

import { LoaderCircle } from 'lucide-react'
import { useActionState, type ReactNode } from 'react'
import type { Dicionario } from '@/lib/i18n/dicionario'
import type { Resultado } from '@/lib/resultado'

const VARIANTE = {
  primaria: 'bg-marca text-white hover:bg-marca-escuro',
  secundaria: 'border border-borda-forte bg-superficie text-tinta hover:border-marca hover:text-marca',
  perigo: 'bg-perigo text-white hover:opacity-90',
} as const

export function FormAcao({
  acao,
  rotulo,
  rotuloPendente,
  t,
  variante = 'primaria',
  ocultos = {},
  desabilitado = false,
  larguraTotal = false,
  children,
}: {
  acao: (estado: Resultado, dados: FormData) => Promise<Resultado>
  rotulo: string
  rotuloPendente?: string
  t: Dicionario['form']
  variante?: keyof typeof VARIANTE
  ocultos?: Record<string, string>
  desabilitado?: boolean
  larguraTotal?: boolean
  children?: ReactNode
}) {
  const [estado, enviar, pendente] = useActionState(acao, null)
  const erros: Record<string, string> = t.erros
  return (
    <form action={enviar} className="space-y-3">
      {Object.entries(ocultos).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      {children}
      <button
        type="submit"
        disabled={pendente || desabilitado}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-[15px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTE[variante]} ${larguraTotal ? 'w-full' : ''}`}
      >
        {pendente ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
        {pendente ? (rotuloPendente ?? t.pendente) : rotulo}
      </button>
      {estado && !pendente ? (
        <p role="status" className={`break-words text-[14px] leading-snug ${estado.ok ? 'text-sucesso' : 'text-perigo'}`}>
          {estado.ok ? t.concluido : `${t.falhou}. ${erros[estado.erro] ?? estado.erro}`}
        </p>
      ) : null}
    </form>
  )
}
