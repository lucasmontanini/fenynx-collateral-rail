import { Building2, FileCheck2, Layers, Truck } from 'lucide-react'
import Image from 'next/image'
import type { Ativo, ClasseToken } from '@/lib/domain/case'

const LOGO = { XRP: '/ativos/XRP.png', BTC: '/ativos/BTC.png' } as const
const ICONE_CLASSE = { imovel: Building2, veiculo: Truck, recebivel: FileCheck2 } as const

/**
 * Logo do ativo em garantia. XRP e Bitcoin usam o logo. Tokens MPT usam um selo com o icone
 * da classe do ativo real. A cesta usa um selo proprio.
 */
export function IconeAtivo({
  ativo,
  tamanho = 40,
  classe = 'imovel',
}: {
  ativo: Ativo
  tamanho?: number
  classe?: ClasseToken
}) {
  if (ativo === 'XRP' || ativo === 'BTC') {
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
  const Icone = ativo === 'CESTA' ? Layers : ICONE_CLASSE[classe]
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full text-white ${ativo === 'CESTA' ? 'bg-marca-escuro' : 'bg-marca'}`}
      style={{ width: tamanho, height: tamanho }}
      aria-label={ativo === 'CESTA' ? 'Cesta' : 'Token MPT'}
      role="img"
    >
      <Icone size={Math.round(tamanho * 0.5)} strokeWidth={1.75} aria-hidden />
    </span>
  )
}
