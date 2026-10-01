import type { LucideIcon } from 'lucide-react'

export function KpiCard({
  rotulo,
  valor,
  apoio,
  icone: Icone,
}: {
  rotulo: string
  valor: string
  apoio?: string
  icone: LucideIcon
}) {
  return (
    <div className="flex min-h-[156px] flex-col justify-between rounded-cartao border border-borda bg-superficie p-5 shadow-cartao">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[15px] font-medium text-tinta-sub">{rotulo}</span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-marca-suave text-marca">
          <Icone size={20} strokeWidth={1.75} aria-hidden />
        </span>
      </div>
      <div>
        <div className="tabular whitespace-nowrap text-[24px] font-semibold leading-tight tracking-tight text-tinta min-[1400px]:text-[28px]">{valor}</div>
        <div className="mt-1 min-h-5 text-[14px] text-tinta-sub">{apoio}</div>
      </div>
    </div>
  )
}
