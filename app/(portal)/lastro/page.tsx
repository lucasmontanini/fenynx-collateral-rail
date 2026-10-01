import { Banknote, CalendarClock, Coins, Lock, TriangleAlert } from 'lucide-react'
import { registrarAtestado } from '@/app/acoes'
import { FormAcao } from '@/components/FormAcao'
import { IconeAtivo } from '@/components/IconeAtivo'
import { LogoZuvia } from '@/components/LogoZuvia'
import { LinkExterno } from '@/components/LinkExterno'
import { BarrasValor } from '@/components/graficos/BarrasValor'
import { Badge, type Tom } from '@/components/ui/Badge'
import { Campo } from '@/components/ui/Campo'
import { Card } from '@/components/ui/Card'
import { CardTitulo } from '@/components/ui/CardTitulo'
import { KpiCard } from '@/components/ui/KpiCard'
import { Medidor } from '@/components/ui/Medidor'
import { SectionHeader } from '@/components/ui/SectionHeader'
import {
  LASTRO_TERRE02,
  parcelasVencidas,
  precoPorM2,
  scoreDoLastro,
  type Score,
} from '@/lib/domain/lastro'
import { brl, dataHora, encurtar, numero, percentual, taxa } from '@/lib/formato'
import { traducao } from '@/lib/i18n/servidor'
import { carregarLastroVigente } from '@/lib/lastro/vigente'
import { EXPLORER } from '@/lib/xrpl/config'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'

const TOM_FAIXA: Record<Score['faixa'], Tom> = { saudavel: 'sucesso', atencao: 'alerta', risco: 'perigo' }

export default async function Lastro() {
  const { t, idioma } = await traducao()
  const l = t.lastro
  const { titulo, empreendimento, mercado } = LASTRO_TERRE02
  const [painel, { atestados, anuncio, vigente, score }] = await Promise.all([painelDaRequisicao(), carregarLastroVigente()])
  const agora = Date.now()
  const dia = (iso: string) => dataHora(`${iso.slice(0, 10)}T12:00:00-03:00`, idioma).split(',')[0] ?? ''
  const estoque = Math.max(0, 1 - vigente.vendidos - vigente.reservados - empreendimento.statusLotes.usoComum)

  const travados = painel.operacoes
    .filter((o) => o.simbolo === LASTRO_TERRE02.ticker && o.status === 'ativa')
    .reduce((soma, o) => soma + o.garantiaQtd, 0)
  const vencidas = parcelasVencidas(agora)
  const proxima = titulo.cronograma.find((d) => new Date(`${d}T23:59:59-03:00`).getTime() > agora)
  const m2Atual = precoPorM2(vigente.precoAnuncio, vigente.areaAnuncioM2)
  const m2Referencia = mercado.precoReferencia / mercado.areaReferenciaM2
  const emissaoBRL = titulo.tokens * titulo.precoUnitario
  const lotesEmEstoque = Math.round(empreendimento.lotes * estoque)
  const valorEstoque = anuncio ? lotesEmEstoque * anuncio.preco : null
  const atrasada = agora > new Date(`${empreendimento.entregaPrevista}T23:59:59-03:00`).getTime() && vigente.obra < 1
  const linha = 'flex items-baseline justify-between gap-4 border-b border-borda py-3 text-[15px] last:border-0'
  const rotulo = 'text-tinta-sub'

  return (
    <>
      <SectionHeader
        titulo={l.titulo}
        subtitulo={l.subtitulo}
        acao={<Badge tom={TOM_FAIXA[score.faixa]}>{`${l.score} ${score.total} · ${l.faixa[score.faixa]}`}</Badge>}
      />

      <div className="mb-6 flex items-center gap-4">
        <IconeAtivo ativo="MPT" tamanho={52} />
        <div>
          <div className="text-[19px] font-semibold text-tinta">
            {LASTRO_TERRE02.ticker} · {empreendimento.nome}
          </div>
          <div className="text-[15px] text-tinta-sub">
            {t.rotulos.rwa} · MPT · {empreendimento.cidade}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5">
        <KpiCard
          rotulo={l.emissao}
          valor={brl(emissaoBRL, idioma)}
          apoio={`${numero(titulo.tokens, idioma, 0)} ${l.tokens} ${l.aCada} ${brl(titulo.precoUnitario, idioma)}`}
          icone={Coins}
        />
        <KpiCard
          rotulo={l.exposicao}
          valor={numero(travados, idioma, 0)}
          apoio={`${LASTRO_TERRE02.ticker} · ${taxa(travados / titulo.tokens, idioma)} ${l.daEmissao}`}
          icone={Lock}
        />
        <KpiCard
          rotulo={l.proximaParcela}
          valor={proxima ? dia(proxima) : l.semParcela}
          apoio={proxima ? brl(titulo.parcelaMensal, idioma) : undefined}
          icone={CalendarClock}
        />
        <KpiCard
          rotulo={l.principal}
          valor={brl(emissaoBRL, idioma)}
          apoio={dia(titulo.vencimento)}
          icone={Banknote}
        />
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-5">
        <Card>
          <CardTitulo titulo={l.score} ajuda={l.scoreAjuda} />
          <div className="mb-5 flex items-baseline gap-3">
            <span className="tabular text-[52px] font-semibold leading-none tracking-tight">{score.total}</span>
            <span className="text-[15px] text-tinta-sub">/ 100</span>
            <Badge tom={TOM_FAIXA[score.faixa]}>{l.faixa[score.faixa]}</Badge>
          </div>
          <div className="flex flex-col gap-4">
            {score.componentes.map((c) => (
              <div key={c.chave}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="text-tinta-700">
                    {l.componentes[c.chave]} <span className="text-tinta-sub">({c.peso})</span>
                  </span>
                  <span className="tabular font-medium">{percentual(c.nota, idioma)}</span>
                </div>
                <Medidor
                  valor={c.nota}
                  tom={c.nota >= 0.75 ? 'sucesso' : c.nota >= 0.5 ? 'alerta' : 'perigo'}
                  rotulo={l.componentes[c.chave]}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitulo titulo={l.tituloCard} acao={<LogoZuvia altura={24} />} />
          <div className={linha}>
            <span className={rotulo}>{l.emissora}</span>
            <span className="text-right">{titulo.emissora}</span>
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.devedora}</span>
            <span className="text-right">{titulo.devedora}</span>
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.instrumento}</span>
            <span className="text-right">{l.instrumentoValor}</span>
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.remuneracao}</span>
            <span className="tabular text-right">
              {taxa(titulo.taxaMensal, idioma)} {l.remuneracaoValor}
            </span>
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.prazo}</span>
            <span className="tabular text-right">
              {dia(titulo.inicio)} · {dia(titulo.vencimento)}
            </span>
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.distribuicao}</span>
            <span className="tabular">{brl(titulo.taxaDistribuicao, idioma)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-3 text-[15px]">
            <span className={rotulo}>{l.garantias}</span>
            <span className="flex flex-wrap justify-end gap-2">
              <Badge tom="marca">{l.garantiaReal}</Badge>
              <Badge tom="marca">{l.garantiaFiduciaria}</Badge>
              <Badge tom="marca">{l.garantiaAval}</Badge>
            </span>
          </div>
          <div className="mt-4 border-t border-borda pt-5">
            <div className="text-[15px] font-semibold">{l.cronograma}</div>
            <p className="mb-4 mt-1 text-[14px] text-tinta-sub">{l.cronogramaAjuda}</p>
            <ol className="grid grid-cols-6 gap-2">
              {titulo.cronograma.map((data, i) => {
                const estado = i < vigente.parcelasPagas ? 'paga' : i < vencidas ? 'vencida' : 'aVencer'
                const cor = { paga: 'bg-sucesso', vencida: 'bg-perigo', aVencer: 'bg-borda-forte' }[estado]
                return (
                  <li key={data} className="rounded-[10px] border border-borda px-2.5 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${cor}`} />
                      <span className="tabular text-[13px] font-medium text-tinta">{dia(data)}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-tinta-sub">{l[estado]}</div>
                  </li>
                )
              })}
            </ol>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-5">
        <Card>
          <CardTitulo titulo={l.empreendimento} />
          <div className="text-[16px] font-semibold">{empreendimento.nome}</div>
          <div className="mb-2 text-[14px] text-tinta-sub">
            {empreendimento.endereco}, {empreendimento.cidade}
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.area}</span>
            <span className="tabular">{numero(empreendimento.areaM2, idioma, 0)} m²</span>
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.areaVerde}</span>
            <span className="tabular">{numero(empreendimento.areaVerdeM2, idioma, 0)} m²</span>
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.lotes}</span>
            <span className="tabular">
              {empreendimento.lotes} · {l.loteMinimo} {empreendimento.loteMinimoM2} m²
            </span>
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.matricula}</span>
            <span className="tabular text-right">{empreendimento.matricula}</span>
          </div>
          <div className={linha}>
            <span className={rotulo}>{l.alvara}</span>
            <span className="tabular">
              {empreendimento.alvara} · {dia(empreendimento.alvaraData)}
            </span>
          </div>
          <div className="pt-3 text-[13px] leading-snug text-tinta-sub">{empreendimento.cartorio}</div>
        </Card>

        <Card>
          <CardTitulo
            titulo={l.obra}
            acao={atrasada ? <Badge tom="alerta">{l.atrasada}</Badge> : undefined}
          />
          <div className="mb-1 flex items-baseline justify-between">
            <span className="tabular text-[34px] font-semibold tracking-tight">{percentual(vigente.obra, idioma)}</span>
            <span className="text-[14px] text-tinta-sub">{l.obraGeral}</span>
          </div>
          <Medidor valor={vigente.obra} rotulo={l.obraGeral} />
          <div className="tabular mb-5 mt-2 text-[13px] text-tinta-sub">
            {l.entrega} {dia(empreendimento.entregaPrevista)}
          </div>
          <BarrasValor
            barras={empreendimento.etapas.map((e) => ({
              rotulo: l.etapas[e.chave],
              valor: e.avanco,
              texto: percentual(e.avanco, idioma),
            }))}
          />
        </Card>

        <Card>
          <CardTitulo titulo={l.statusLotes} />
          <BarrasValor
            barras={[
              { rotulo: l.vendidos, valor: vigente.vendidos, texto: percentual(vigente.vendidos, idioma) },
              { rotulo: l.reservados, valor: vigente.reservados, texto: percentual(vigente.reservados, idioma) },
              {
                rotulo: l.estoque,
                apoio: `${lotesEmEstoque} ${l.lotes.toLowerCase()}`,
                valor: estoque,
                texto: percentual(estoque, idioma),
              },
              {
                rotulo: l.usoComum,
                valor: empreendimento.statusLotes.usoComum,
                texto: percentual(empreendimento.statusLotes.usoComum, idioma),
              },
            ]}
          />
        </Card>
      </div>

      <Card className="mt-5">
        <CardTitulo
          titulo={l.mercado}
          acao={<Badge tom={anuncio ? 'sucesso' : 'alerta'}>{anuncio ? l.aoVivo : l.foraDoAr}</Badge>}
        />
        <div className="grid grid-cols-4 gap-6">
          <div>
            <div className="text-[14px] text-tinta-sub">{l.anuncio}</div>
            <div className="tabular text-[24px] font-semibold tracking-tight">
              {anuncio ? brl(anuncio.preco, idioma) : l.foraDoAr}
            </div>
            <div className="tabular text-[13px] text-tinta-sub">
              {anuncio ? `${numero(anuncio.areaM2, idioma, 0)} m² · ` : ''}
              {mercado.imobiliaria} {mercado.codigoAnuncio}
            </div>
          </div>
          <div>
            <div className="text-[14px] text-tinta-sub">{l.porM2}</div>
            <div className="tabular text-[24px] font-semibold tracking-tight">{m2Atual ? brl(m2Atual, idioma) : ''}</div>
            <div className="tabular text-[13px] text-tinta-sub">
              {m2Atual ? `${taxa(m2Atual / m2Referencia - 1, idioma)} ${l.variacao}` : ''}
            </div>
          </div>
          <div>
            <div className="text-[14px] text-tinta-sub">{l.equivalencia}</div>
            <div className="tabular text-[24px] font-semibold tracking-tight">
              {anuncio ? numero(emissaoBRL / anuncio.preco, idioma, 1) : ''}
            </div>
            <div className="text-[13px] text-tinta-sub">{l.lotesAoPreco}</div>
          </div>
          <div>
            <div className="text-[14px] text-tinta-sub">{l.estoqueEstimado}</div>
            <div className="tabular text-[24px] font-semibold tracking-tight">
              {valorEstoque !== null ? brl(valorEstoque, idioma) : ''}
            </div>
            <div className="tabular text-[13px] text-tinta-sub">
              {valorEstoque !== null ? `${numero(valorEstoque / emissaoBRL, idioma, 0)} ${l.vezesEmissao}` : ''}
            </div>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-snug text-tinta-sub">{l.estoqueAjuda}</p>
      </Card>

      <div className="mt-5 grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-5">
        <Card>
          <CardTitulo titulo={l.atestados} ajuda={l.atestadosAjuda} />
          {atestados.length === 0 ? (
            <p className="text-[15px] text-tinta-sub">{l.semAtestado}</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-borda text-left text-[13px] font-medium text-tinta-sub">
                  <th className="pb-3 font-medium">{l.colData}</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 text-right font-medium">{l.colObra}</th>
                  <th className="pb-3 text-right font-medium">{l.vendidos}</th>
                  <th className="pb-3 text-right font-medium">{l.colM2}</th>
                  <th className="pb-3 text-right font-medium">XRPL</th>
                </tr>
              </thead>
              <tbody>
                {atestados.map((a) => {
                  const s = scoreDoLastro(a, new Date(a.em).getTime())
                  const m2 = precoPorM2(a.precoAnuncio, a.areaAnuncioM2)
                  return (
                    <tr key={a.hash} className="tabular h-12 border-b border-borda text-[15px] last:border-0">
                      <td className="whitespace-nowrap text-tinta-sub">{dataHora(a.em, idioma)}</td>
                      <td className="whitespace-nowrap">
                        <span className="mr-2 font-medium">{s.total}</span>
                        <Badge tom={TOM_FAIXA[s.faixa]}>{l.faixa[s.faixa]}</Badge>
                      </td>
                      <td className="text-right">{percentual(a.obra, idioma)}</td>
                      <td className="text-right">{percentual(a.vendidos, idioma)}</td>
                      <td className="text-right">{m2 ? brl(m2, idioma) : l.foraDoAr}</td>
                      <td className="text-right">
                        <LinkExterno href={`${EXPLORER}/transactions/${a.hash}`}>{encurtar(a.hash, 6, 4)}</LinkExterno>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
        <Card>
          <CardTitulo titulo={l.novo} ajuda={l.novoAjuda} />
          <FormAcao acao={registrarAtestado} rotulo={l.registrar} t={t.form}>
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo={l.campoObra} nome="obra" tipo="number" valorInicial={String(Math.round(vigente.obra * 1000) / 10)} />
              <Campo rotulo={l.campoParcelas} nome="parcelasPagas" tipo="number" valorInicial={String(vigente.parcelasPagas)} />
              <Campo rotulo={l.campoVendidos} nome="vendidos" tipo="number" valorInicial={String(Math.round(vigente.vendidos * 1000) / 10)} />
              <Campo rotulo={l.campoReservados} nome="reservados" tipo="number" valorInicial={String(Math.round(vigente.reservados * 1000) / 10)} />
            </div>
          </FormAcao>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-5">
        <Card>
          <CardTitulo titulo={l.atencao} />
          <ul className="flex flex-col gap-3">
            {[l.a1, l.a2, l.a3, l.a4, l.a5, l.a6].map((texto) => (
              <li key={texto} className="flex gap-3 text-[15px] leading-snug text-tinta-700">
                <TriangleAlert size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-alerta" aria-hidden />
                {texto}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitulo titulo={l.fontes} />
          <ul className="flex flex-col gap-2.5">
            {LASTRO_TERRE02.fontes.map((f) => (
              <li key={f.chave}>
                <LinkExterno href={f.url}>{l.fonte[f.chave]}</LinkExterno>
              </li>
            ))}
          </ul>
          <p className="tabular mt-4 text-[13px] text-tinta-sub">
            {l.lidoEm} {dia(LASTRO_TERRE02.lidoEm)}
          </p>
        </Card>
      </div>
    </>
  )
}
