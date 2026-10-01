import { ChevronLeft, Coins, Hash, Lock, Tag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { IconeAtivo } from '@/components/IconeAtivo'
import { LinkExterno } from '@/components/LinkExterno'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { CardTitulo } from '@/components/ui/CardTitulo'
import { KpiCard } from '@/components/ui/KpiCard'
import { brl, encurtar, numero } from '@/lib/formato'
import { traducao } from '@/lib/i18n/servidor'
import { CATALOGO_TOKENS } from '@/lib/tokens'
import { EXPLORER } from '@/lib/xrpl/config'
import { carregarEmissoes } from '@/lib/xrpl/leitura'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'
import { comLedger } from '@/lib/xrpl/servidor'

function texto(valor: unknown): string {
  if (typeof valor === 'string') return valor
  if (typeof valor === 'number') return String(valor)
  return JSON.stringify(valor)
}

export default async function DossieToken({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  const { t, idioma } = await traducao()
  const token = CATALOGO_TOKENS.find((k) => k.ticker === ticker.toUpperCase())
  const voltar = (
    <Link href="/tokens" className="mb-4 inline-flex items-center gap-1 text-[14px] text-tinta-sub hover:text-tinta">
      <ChevronLeft size={15} strokeWidth={1.75} aria-hidden />
      {t.tokens.titulo}
    </Link>
  )
  if (!token) {
    return (
      <>
        {voltar}
        <Card>
          <p className="text-[15px] text-tinta-sub">{t.tokens.naoEncontrado}</p>
        </Card>
      </>
    )
  }
  const [emissoes, { operacoes }] = await Promise.all([comLedger(carregarEmissoes), painelDaRequisicao()])
  const emissao = emissoes.find((e) => e.ticker === token.ticker)
  const travas = operacoes.flatMap((o) => {
    const item = o.itens?.find((i) => i.chave === token.ticker)
    if (item && item.quantidade > 0) return [{ conta: o.conta, quantidade: item.quantidade, nome: o.modelo ?? t.produto[o.produto] }]
    if (o.simbolo === token.ticker && o.garantiaQtd > 0) return [{ conta: o.conta, quantidade: o.garantiaQtd, nome: t.produto[o.produto] }]
    return []
  })
  const travado = travas.reduce((soma, x) => soma + x.quantidade, 0)
  const meta = emissao?.metadados ?? {}
  const info = meta.additional_info !== null && typeof meta.additional_info === 'object' ? (meta.additional_info as Record<string, unknown>) : {}
  const uris = Array.isArray(meta.uris) ? (meta.uris as Record<string, unknown>[]) : []
  const linha = 'flex items-baseline justify-between gap-6 border-b border-borda py-3 text-[15px] last:border-0'
  const campos: [string, unknown][] = [
    ['ticker', meta.ticker],
    ['name', meta.name],
    ['desc', meta.desc],
    ['asset_class', meta.asset_class],
    ['asset_subclass', meta.asset_subclass],
    ['issuer_name', meta.issuer_name],
    ['icon', meta.icon],
  ]

  return (
    <>
      {voltar}
      <header className="mb-8 flex items-center gap-5">
        <IconeAtivo ativo="MPT" tamanho={64} classe={token.classe} />
        <div>
          <h1 className="text-[34px] font-semibold leading-tight tracking-tight">{token.ticker}</h1>
          <p className="mt-1 text-[17px] text-tinta-sub">{token.nome}</p>
          <div className="mt-3 flex gap-1.5">
            <Badge tom="marca">MPT</Badge>
            <Badge tom="info">{t.rotulos[token.classe]}</Badge>
            <Badge>XLS 33</Badge>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-5">
        <KpiCard rotulo={t.tokens.valor} valor={brl(token.valorUnitario, idioma)} icone={Tag} />
        <KpiCard
          rotulo={t.tokens.emitido}
          valor={emissao ? numero(emissao.emitido, idioma, 0) : '0'}
          apoio={emissao?.maximo ? `${t.tokens.maximo} ${numero(emissao.maximo, idioma, 0)}` : undefined}
          icone={Coins}
        />
        <KpiCard rotulo={t.tokens.onde} valor={numero(travado, idioma, 0)} apoio={brl(travado * token.valorUnitario, idioma)} icone={Lock} />
        <KpiCard
          rotulo={t.tokens.emissao}
          valor={emissao ? encurtar(emissao.emissaoId, 6, 4) : t.tokens.naoEmitido}
          apoio={token.emissor}
          icone={Hash}
        />
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5">
        <div className="flex flex-col gap-5">
          <Card>
            {token.imagem ? (
              <>
                <Image src={token.imagem} alt={token.nome} width={640} height={360} className="w-full rounded-[14px]" />
                <p className="mt-3 text-[13px] text-tinta-sub">{t.tokens.imagem}</p>
              </>
            ) : null}
            <p className="mt-3 text-[15px] leading-snug text-tinta-700">{token.descricao}</p>
            {emissao ? (
              <div className="mt-4">
                <LinkExterno href={`${EXPLORER}/mpt/${emissao.emissaoId}`}>{t.tokens.explorer}</LinkExterno>
              </div>
            ) : null}
          </Card>
          <Card>
            <CardTitulo titulo={t.tokens.onde} />
            {travas.length === 0 ? (
              <p className="text-[15px] text-tinta-sub">{t.tokens.semTrava}</p>
            ) : (
              travas.map((x) => (
                <div key={x.conta} className={linha}>
                  <Link href={`/operacoes/${x.conta}`} className="font-medium text-marca hover:text-marca-escuro">
                    {x.nome} · {encurtar(x.conta)}
                  </Link>
                  <span className="tabular">{numero(x.quantidade, idioma, 0)}</span>
                </div>
              ))
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardTitulo titulo={t.tokens.metadados} ajuda={t.tokens.metadadosAjuda} acao={<Badge>XLS 89</Badge>} />
            {campos
              .filter(([, valor]) => valor !== undefined && valor !== null)
              .map(([chave, valor]) => (
                <div key={chave} className={linha}>
                  <span className="shrink-0 text-tinta-sub">{chave}</span>
                  <span className="break-all text-right">{texto(valor)}</span>
                </div>
              ))}
            {uris.map((u) => (
              <div key={texto(u.uri)} className={linha}>
                <span className="shrink-0 text-tinta-sub">uri · {texto(u.title)}</span>
                <span className="break-all text-right">{texto(u.uri)}</span>
              </div>
            ))}
          </Card>
          <Card>
            <CardTitulo titulo={t.tokens.dados} />
            {Object.entries(info).map(([chave, valor]) => (
              <div key={chave} className={linha}>
                <span className="text-tinta-sub">{chave}</span>
                <span className="tabular text-right">{texto(valor)}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  )
}
