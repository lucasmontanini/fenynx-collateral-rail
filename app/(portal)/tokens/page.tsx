import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { IconeAtivo } from '@/components/IconeAtivo'
import { Badge } from '@/components/ui/Badge'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { brl, encurtar, numero } from '@/lib/formato'
import { traducao } from '@/lib/i18n/servidor'
import { CATALOGO_TOKENS } from '@/lib/tokens'
import { carregarEmissoes } from '@/lib/xrpl/leitura'
import { comLedger } from '@/lib/xrpl/servidor'

export default async function Tokens() {
  const { t, idioma } = await traducao()
  const emissoes = await comLedger(carregarEmissoes)
  return (
    <>
      <SectionHeader titulo={t.tokens.titulo} subtitulo={t.tokens.subtitulo} />
      <div className="grid grid-cols-3 gap-5">
        {CATALOGO_TOKENS.map((token) => {
          const emissao = emissoes.find((e) => e.ticker === token.ticker)
          return (
            <article key={token.ticker} className="flex flex-col overflow-hidden rounded-cartao border border-borda bg-superficie shadow-cartao">
              <div className="flex h-44 items-center justify-center bg-marca-suave">
                {token.imagem ? (
                  <Image src={token.imagem} alt={token.nome} width={320} height={180} className="h-full w-full object-cover" />
                ) : (
                  <IconeAtivo ativo="MPT" tamanho={72} classe={token.classe} />
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-2">
                  <Badge tom="marca">MPT</Badge>
                  <Badge tom="info">{t.rotulos[token.classe]}</Badge>
                </div>
                <h2 className="mt-3 text-[19px] font-semibold text-tinta">{token.ticker}</h2>
                <p className="text-[15px] text-tinta-700">{token.nome}</p>
                <dl className="tabular mt-4 grid grid-cols-2 gap-3 text-[14px]">
                  <div>
                    <dt className="text-tinta-sub">{t.tokens.emitido}</dt>
                    <dd className="text-[16px] font-medium">{emissao ? numero(emissao.emitido, idioma, 0) : ''}</dd>
                  </div>
                  <div>
                    <dt className="text-tinta-sub">{t.tokens.valor}</dt>
                    <dd className="text-[16px] font-medium">{brl(token.valorUnitario, idioma)}</dd>
                  </div>
                </dl>
                <p className="tabular mb-5 mt-3 text-[13px] text-tinta-sub">
                  {emissao ? `${t.tokens.emissao} ${encurtar(emissao.emissaoId, 8, 6)}` : t.tokens.naoEmitido}
                </p>
                <Link
                  href={token.lastro ?? `/tokens/${token.ticker}`}
                  className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-marca px-4 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-marca-escuro"
                >
                  {token.lastro ? t.tokens.lastro : t.tokens.abrir}
                  <ArrowRight size={16} strokeWidth={2} aria-hidden />
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
