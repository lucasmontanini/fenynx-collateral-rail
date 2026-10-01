'use client'

import { Eye, LoaderCircle } from 'lucide-react'
import { useActionState } from 'react'
import { revelarCliente } from '@/app/acoes'
import type { Dicionario } from '@/lib/i18n/dicionario'

/** Consulta sob demanda do nome do cliente. O nome so aparece depois do clique e nao fica guardado. */
export function RevelarCliente({ emprestimo, t, falhou }: { emprestimo: string; t: Dicionario['cliente']; falhou: string }) {
  const [estado, enviar, pendente] = useActionState(revelarCliente, null)
  if (estado?.ok) {
    return (
      <dl className="grid grid-cols-2 gap-4 text-[15px]">
        <div>
          <dt className="text-[13px] text-tinta-sub">{t.nome}</dt>
          <dd className="font-medium text-tinta">{estado.nome}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-tinta-sub">{t.documento}</dt>
          <dd className="tabular font-medium text-tinta">{estado.documento}</dd>
        </div>
      </dl>
    )
  }
  return (
    <form action={enviar}>
      <input type="hidden" name="emprestimo" value={emprestimo} />
      <button
        type="submit"
        disabled={pendente}
        className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-borda-forte bg-superficie px-4 text-[15px] font-medium text-tinta transition-colors duration-150 hover:border-marca hover:text-marca disabled:opacity-50"
      >
        {pendente ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : <Eye size={16} strokeWidth={1.75} aria-hidden />}
        {pendente ? t.revelando : t.revelar}
      </button>
      {estado && !estado.ok ? (
        <p role="status" className="mt-3 break-words text-[14px] text-perigo">
          {falhou}. {estado.erro}
        </p>
      ) : null}
    </form>
  )
}
