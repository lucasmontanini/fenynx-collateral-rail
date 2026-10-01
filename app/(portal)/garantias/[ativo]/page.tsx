import { Banknote, Gauge, Lock, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { BadgeNivel } from '@/components/BadgeNivel'
import { IconeAtivo } from '@/components/IconeAtivo'
import { RotulosAtivo } from '@/components/RotulosAtivo'
import { GraficoEstresse } from '@/components/graficos/GraficoEstresse'
import { GraficoPreco } from '@/components/graficos/GraficoPreco'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { CardTitulo } from '@/components/ui/CardTitulo'
import { KpiCard } from '@/components/ui/KpiCard'
import { curvaDeEstresse } from '@/lib/domain/carteira'
import { CASE_FENYNX } from '@/lib/domain/case'
import { brl, dataHora, encurtar, percentual, quantidade, taxa } from '@/lib/formato'
import { traducao } from '@/lib/i18n/servidor'
import { historicoDePreco } from '@/lib/precos'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'

export default async function PaginaAtivo({ params }: { params: Promise<{ ativo: string }> }) {
  const { ativo: bruto } = await params
  const { t, idioma } = await traducao()
  const ativo = bruto.toUpperCase()
  if (ativo !== 'XRP' && ativo !== 'BTC') {
    return (
      <Card>
        <p className="text-[15px] text-tinta-sub">{t.ativo.naoEncontrado}</p>
      </Card>
    )
  }
  const a = t.ativo
  const [{ precos, operacoes }, historico] = await Promise.all([painelDaRequisicao(), historicoDePreco(ativo)])
  const preco = precos[ativo]
  const ops = operacoes
    .filter((o) => o.ativo === ativo && o.status === 'ativa')
    .sort((x, y) => (y.precoMargem ?? 0) - (x.precoMargem ?? 0))
  const garantiaQtd = ops.reduce((soma, o) => soma + o.garantiaQtd, 0)
  const garantiaBRL = ops.reduce((soma, o) => soma + (o.garantiaBRL ?? 0), 0)
  const divida = ops.reduce((soma, o) => soma + o.saldoDevedor, 0)
  const maisExposta = ops[0]

  const fechamentos = historico.map((p) => p.valor)
  const primeiro = fechamentos[0]
  const ultimo = fechamentos[fechamentos.length - 1]
  const variacao = primeiro && ultimo ? ultimo / primeiro - 1 : null
  const piorDia = fechamentos.reduce<number | null>((pior, v, i) => {
    const anterior = fechamentos[i - 1]
    if (!anterior) return pior
    const retorno = v / anterior - 1
    return pior === null || retorno < pior ? retorno : pior
  }, null)
  const dia = (iso: string) => dataHora(`${iso}T12:00:00-03:00`, idioma).split(',')[0]?.slice(0, 5) ?? iso

  const gatilhos = [
    maisExposta?.precoMargem ? { valor: maisExposta.precoMargem, rotulo: `${t.nivel.recomposicao} ${brl(maisExposta.precoMargem, idioma)}` } : null,
    maisExposta?.precoLiquidacao ? { valor: maisExposta.precoLiquidacao, rotulo: `${t.nivel.realizacao} ${brl(maisExposta.precoLiquidacao, idioma)}` } : null,
  ].filter((g): g is { valor: number; rotulo: string } => g !== null)
  const estresse = curvaDeEstresse(ops).map((ponto) => ({
    queda: Math.round(ponto.queda * 100),
    ltv: Math.round(ponto.ltv * 1000) / 10,
    rotuloQueda: percentual(ponto.queda, idioma),
    rotuloLtv: percentual(ponto.ltv, idioma),
    emMargem: ponto.emMargem,
    emLiquidacao: ponto.emLiquidacao,
  }))
  const th = 'pb-3 text-left text-[13px] font-medium text-tinta-sub'

  return (
    <>
      <header className="mb-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <IconeAtivo ativo={ativo} tamanho={64} />
          <div>
            <h1 className="text-[34px] font-semibold leading-tight tracking-tight">{a.nome[ativo]}</h1>
            <p className="mt-1 text-[17px] text-tinta-sub">{a.subtitulo[ativo]}</p>
            <div className="mt-3">
              <RotulosAtivo ativo={ativo} t={t.rotulos} />
            </div>
          </div>
        </div>
        <Badge tom={precos.simulado ? 'alerta' : 'sucesso'}>{precos.simulado ? t.nav.simulado : t.nav.mercado}</Badge>
      </header>

      <div className="grid grid-cols-4 gap-5">
        <KpiCard
          rotulo={a.preco}
          valor={preco ? brl(preco.valor, idioma) : t.visao.semPreco}
          apoio={variacao !== null ? `${taxa(variacao, idioma)} · ${a.variacao30}` : undefined}
          icone={TrendingDown}
        />
        <KpiCard
          rotulo={a.travado}
          valor={brl(garantiaBRL, idioma)}
          apoio={quantidade(garantiaQtd, ativo, idioma)}
          icone={Lock}
        />
        <KpiCard
          rotulo={a.divida}
          valor={brl(divida, idioma)}
          apoio={`${ops.length} ${t.visao.operacoes}`}
          icone={Banknote}
        />
        <KpiCard
          rotulo={a.ltv}
          valor={garantiaBRL > 0 ? percentual(divida / garantiaBRL, idioma) : '0%'}
          apoio={maisExposta?.precoMargem ? `${a.primeiraMargem} ${brl(maisExposta.precoMargem, idioma)}` : undefined}
          icone={Gauge}
        />
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-5">
        <Card>
          <CardTitulo titulo={a.historico} ajuda={a.historicoAjuda} />
          {historico.length > 1 ? (
            <GraficoPreco
              pontos={historico.map((p) => ({ dia: dia(p.dia), valor: p.valor, rotulo: brl(p.valor, idioma) }))}
              gatilhos={gatilhos}
            />
          ) : (
            <p className="py-10 text-[15px] text-tinta-sub">{a.semHistorico}</p>
          )}
        </Card>
        <div className="flex flex-col gap-5">
          <Card>
            <div className="text-[14px] text-tinta-sub">{a.piorDia}</div>
            <div className="tabular mt-1 text-[28px] font-semibold tracking-tight">{piorDia !== null ? taxa(piorDia, idioma) : ''}</div>
            <div className="mt-5 text-[14px] text-tinta-sub">{a.faixa30}</div>
            <div className="tabular mt-1 text-[19px] font-semibold tracking-tight">
              {fechamentos.length > 0 ? `${brl(Math.min(...fechamentos), idioma)} · ${brl(Math.max(...fechamentos), idioma)}` : ''}
            </div>
          </Card>
          <Card>
            <CardTitulo titulo={a.custodia} />
            <p className="text-[15px] leading-snug text-tinta-700">{ativo === 'XRP' ? a.custodiaXRP : a.custodiaBTC}</p>
            <div className="mt-4 text-[14px] text-tinta-sub">{a.fontes}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(preco?.fontes ?? []).map((f) => (
                <Badge key={f.nome}>{`${f.nome} ${brl(f.valor, idioma)}`}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardTitulo titulo={a.gatilhos} ajuda={a.gatilhosAjuda} />
        {ops.length === 0 ? (
          <p className="text-[15px] text-tinta-sub">{a.semOperacoes}</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-borda">
                <th className={th}>{t.operacoes.conta}</th>
                <th className={th}>{t.operacoes.produto}</th>
                <th className={`${th} text-right`}>{t.operacoes.garantia}</th>
                <th className={`${th} text-right`}>{t.operacoes.divida}</th>
                <th className={`${th} pl-8`}>{t.operacoes.ltv}</th>
                <th className={`${th} text-right`}>{a.margemEm}</th>
                <th className={`${th} text-right`}>{a.liquidacaoEm}</th>
                <th className={`${th} text-right`}>{a.folga}</th>
              </tr>
            </thead>
            <tbody>
              {ops.map((o) => (
                <tr key={o.conta} className="tabular h-16 border-b border-borda text-[15px] last:border-0">
                  <td className="font-medium">
                    {o.origem === 'ledger' ? (
                      <Link href={`/operacoes/${o.conta}`} className="text-marca hover:text-marca-escuro">
                        {encurtar(o.conta)}
                      </Link>
                    ) : (
                      (o.cliente ?? t.cliente.origemApi)
                    )}
                  </td>
                  <td className="text-tinta-700">{o.modelo ?? t.produto[o.produto]}</td>
                  <td className="text-right">{quantidade(o.garantiaQtd, o.ativo, idioma)}</td>
                  <td className="text-right">{brl(o.saldoDevedor, idioma)}</td>
                  <td className="pl-8">
                    <span className="flex items-center gap-2">
                      <span className="w-14 font-medium">{o.ltv !== null ? percentual(o.ltv, idioma) : ''}</span>
                      {o.nivel ? <BadgeNivel nivel={o.nivel} t={t.nivel} /> : null}
                    </span>
                  </td>
                  <td className="text-right">{o.precoMargem !== null ? brl(o.precoMargem, idioma) : ''}</td>
                  <td className="text-right">{o.precoLiquidacao !== null ? brl(o.precoLiquidacao, idioma) : ''}</td>
                  <td className="text-right font-medium">{o.folgaMargem !== null ? percentual(o.folgaMargem, idioma) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {ops.length > 0 ? (
        <Card className="mt-5">
          <CardTitulo titulo={a.estresse} ajuda={a.estresseAjuda} />
          <GraficoEstresse
            pontos={estresse}
            gatilhos={[
              { valor: CASE_FENYNX.ltv.recomposicao * 100, rotulo: t.nivel.recomposicao },
              { valor: CASE_FENYNX.ltv.realizacao * 100, rotulo: t.nivel.realizacao },
            ]}
            t={{ quedaDePreco: t.visao.quedaDePreco, ltv: a.ltv, emMargem: t.visao.emMargem, emLiquidacao: t.visao.emLiquidacao }}
          />
        </Card>
      ) : null}
    </>
  )
}
