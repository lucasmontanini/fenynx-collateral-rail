import Link from 'next/link'
import type { ItemGarantia } from '@/lib/domain/operacao'
import { brl, numero, percentual } from '@/lib/formato'
import type { Dicionario, Idioma } from '@/lib/i18n/dicionario'
import { IconeAtivo } from './IconeAtivo'
import { Badge } from './ui/Badge'

/** Composicao da cesta: cada garantia com quantidade, valor, haircut e participacao. */
export function CestaGarantias({ itens, t, idioma }: { itens: ItemGarantia[]; t: Dicionario; idioma: Idioma }) {
  const total = itens.reduce((soma, i) => soma + i.valorElegivel, 0)
  const bruto = itens.reduce((soma, i) => soma + i.valorBruto, 0)
  const th = 'pb-3 text-left text-[13px] font-medium text-tinta-sub'
  const classe = (i: ItemGarantia) => (i.classe === 'cripto' ? t.rotulos.cripto : t.rotulos[i.classe])
  return (
    <>
      <div className="mb-6 flex h-3 gap-[2px] overflow-hidden rounded-full bg-superficie-2">
        {itens.map((i, indice) => (
          <div
            key={i.chave}
            className={['bg-marca', 'bg-marca-escuro', 'bg-borda-forte'][indice % 3]}
            style={{ width: `${total > 0 ? (i.valorElegivel / total) * 100 : 0}%` }}
          />
        ))}
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-borda">
            <th className={th}>{t.cesta.item}</th>
            <th className={`${th} text-right`}>{t.cesta.quantidade}</th>
            <th className={`${th} text-right`}>{t.cesta.valorBruto}</th>
            <th className={`${th} text-right`}>{t.cesta.haircut}</th>
            <th className={`${th} text-right`}>{t.cesta.elegivel}</th>
            <th className={`${th} text-right`}>{t.cesta.participacao}</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i, indice) => (
            <tr key={i.chave} className="tabular h-[72px] border-b border-borda text-[15px]">
              <td>
                <span className="flex items-center gap-3">
                  <span className={`h-9 w-1 rounded-full ${['bg-marca', 'bg-marca-escuro', 'bg-borda-forte'][indice % 3]}`} />
                  <IconeAtivo ativo={i.ativo} tamanho={34} classe={i.classe === 'cripto' ? 'imovel' : i.classe} />
                  <span>
                    <span className="flex items-center gap-2 font-medium text-tinta">
                      {i.simbolo}
                      <Badge tom={i.ativo === 'MPT' ? 'info' : 'neutro'}>{classe(i)}</Badge>
                    </span>
                    {i.ativo === 'MPT' ? (
                      <Link href={`/tokens/${i.simbolo}`} className="text-[13px] font-medium text-marca hover:text-marca-escuro">
                        {t.cesta.verToken}
                      </Link>
                    ) : (
                      <Link href="/garantias/xrp" className="text-[13px] font-medium text-marca hover:text-marca-escuro">
                        {t.ativo.verAtivo}
                      </Link>
                    )}
                  </span>
                </span>
              </td>
              <td className="text-right">{numero(i.quantidade, idioma, i.ativo === 'XRP' ? 2 : 0)}</td>
              <td className="text-right">{brl(i.valorBruto, idioma)}</td>
              <td className="text-right text-tinta-sub">{percentual(i.haircut, idioma)}</td>
              <td className="text-right font-medium">{brl(i.valorElegivel, idioma)}</td>
              <td className="text-right">{total > 0 ? percentual(i.valorElegivel / total, idioma) : ''}</td>
            </tr>
          ))}
          <tr className="tabular h-14 text-[15px] font-semibold">
            <td>{t.cesta.total}</td>
            <td />
            <td className="text-right">{brl(bruto, idioma)}</td>
            <td />
            <td className="text-right">{brl(total, idioma)}</td>
            <td className="text-right">{total > 0 ? percentual(1, idioma) : ''}</td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
