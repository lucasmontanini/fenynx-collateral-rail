import { Building2 } from 'lucide-react'
import Image from 'next/image'
import type { Ativo } from '@/lib/domain/case'

const LOGO: Record<Exclude<Ativo, 'MPT'>, string> = { XRP: '/ativos/XRP.png', BTC: '/ativos/BTC.png' }

/** Logo do ativo em garantia. O token MPT de lastro imobiliario usa um selo proprio. */
export function IconeAtivo({ ativo, tamanho = 40 }: { ativo: Ativo; tamanho?: number }) {
  if (ativo === 'MPT') {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-marca text-white"
        style={{ width: tamanho, height: tamanho }}
        aria-label="Token MPT"
        role="img"
      >
        <Building2 size={Math.round(tamanho * 0.5)} strokeWidth={1.75} aria-hidden />
      </span>
    )
  }
  return (
    <Image
      src={LOGO[ativo]}
      alt={ativo}
      width={tamanho}
      height={tamanho}
      className="shrink-0 rounded-full border border-borda bg-superficie"
    />
  )
}
