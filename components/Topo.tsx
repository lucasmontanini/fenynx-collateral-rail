import { LogOut } from 'lucide-react'
import { sair } from '@/app/acoes'
import { brl } from '@/lib/formato'
import type { Dicionario, Idioma } from '@/lib/i18n/dicionario'
import type { Precos } from '@/lib/xrpl/leitura'
import { Badge } from './ui/Badge'

export function Topo({
  t,
  idioma,
  email,
  precos,
}: {
  t: Dicionario['nav']
  idioma: Idioma
  email: string
  precos: Precos
}) {
  return (
    <div className="flex h-[72px] items-center justify-end gap-4 border-b border-borda bg-superficie px-8">
      <Badge tom="marca">Devnet · {t.ambiente}</Badge>
      <Badge tom={precos.simulado ? 'alerta' : 'sucesso'}>{precos.simulado ? t.simulado : t.mercado}</Badge>
      {(['XRP', 'BTC'] as const).map((ativo) => {
        const preco = precos[ativo]
        return preco ? (
          <span key={ativo} className="tabular text-[14px] text-tinta-sub">
            {ativo} <span className="font-medium text-tinta">{brl(preco.valor, idioma)}</span>
          </span>
        ) : null
      })}
      <span className="h-5 w-px bg-borda" />
      <span className="text-[14px] text-tinta-700">{email}</span>
      <form action={sair}>
        <button
          type="submit"
          aria-label={t.sair}
          title={t.sair}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] text-tinta-sub transition-colors hover:bg-superficie-2 hover:text-tinta"
        >
          <LogOut size={16} strokeWidth={1.75} aria-hidden />
        </button>
      </form>
    </div>
  )
}
