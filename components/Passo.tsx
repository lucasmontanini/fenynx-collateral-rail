import type { ReactNode } from 'react'

/** Bloco de uma acao disponivel na operacao. */
export function Passo({ titulo, ajuda, children }: { titulo: string; ajuda: string; children: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-borda p-5">
      <h3 className="text-[15px] font-semibold text-tinta">{titulo}</h3>
      <p className="mb-4 mt-1 text-[14px] leading-snug text-tinta-sub">{ajuda}</p>
      {children}
    </div>
  )
}
