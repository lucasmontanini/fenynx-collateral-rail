import type { ReactNode } from 'react'

export function CardTitulo({
  titulo,
  ajuda,
  acao,
}: {
  titulo: string
  ajuda?: string
  acao?: ReactNode
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[16px] font-semibold text-tinta">{titulo}</h2>
        {ajuda ? <p className="mt-1 max-w-[52ch] text-[14px] leading-snug text-tinta-sub">{ajuda}</p> : null}
      </div>
      {acao}
    </div>
  )
}
