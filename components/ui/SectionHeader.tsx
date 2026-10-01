import type { ReactNode } from 'react'

export function SectionHeader({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string
  subtitulo?: string
  acao?: ReactNode
}) {
  return (
    <header className="mb-8 flex items-end justify-between gap-6">
      <div>
        <h1 className="text-[34px] font-semibold leading-tight tracking-tight text-tinta">{titulo}</h1>
        {subtitulo ? <p className="mt-1.5 text-[16px] text-tinta-sub">{subtitulo}</p> : null}
      </div>
      {acao}
    </header>
  )
}
