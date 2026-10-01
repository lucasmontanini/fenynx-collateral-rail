import { Banknote, CalendarClock, Gauge, Layers, Lock, Plus, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { inicializarAmbiente } from '@/app/acoes'
import { BotaoLink } from '@/components/BotaoLink'
import { FormAcao } from '@/components/FormAcao'
import { IconeAtivo } from '@/components/IconeAtivo'
import { TabelaOperacoes } from '@/components/TabelaOperacoes'
import { BarraNiveis } from '@/components/graficos/BarraNiveis'
import { BarrasValor } from '@/components/graficos/BarrasValor'
import { GraficoCobertura, type BarraCobertura } from '@/components/graficos/GraficoCobertura'
import { GraficoEstresse } from '@/components/graficos/GraficoEstresse'
import { Card } from '@/components/ui/Card'
import { CardTitulo } from '@/components/ui/CardTitulo'
import { KpiCard } from '@/components/ui/KpiCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { curvaDeEstresse, resumirCarteira } from '@/lib/domain/carteira'
import { CASE_FENYNX } from '@/lib/domain/case'
import type { NivelCobertura } from '@/lib/domain/credito'
import { brl, dataHora, encurtar, percentual } from '@/lib/formato'
import { traducao } from '@/lib/i18n/servidor'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'

const COR_NIVEL: Record<NivelCobertura, string> = {
  entrada: '#15803d',
  alerta: '#b45309',
  recomposicao: '#b91c1c',
  realizacao: '#b91c1c',
}

export default async function Dashboard() {
  const { t, idioma } = await traducao()
  const painel = await painelDaRequisicao()

  if (!painel.inicializado) {
    return (
      <>
        <SectionHeader titulo={t.visao.titulo} subtitulo={t.visao.subtitulo} />
        <Card className="max-w-xl">
          <CardTitulo titulo={t.visao.iniciarTitulo} ajuda={t.visao.iniciarTexto} />
          <FormAcao acao={inicializarAmbiente} rotulo={t.visao.iniciarAcao} t={t.form} />
        </Card>
      </>
    )
  }

  const { operacoes } = painel
  const resumo = resumirCarteira(operacoes)
  const ativas = operacoes.filter((o) => o.status === 'ativa')
  const p = CASE_FENYNX.ltv
  const barras: BarraCobertura[] = ativas
    .filter((o) => o.ltv !== null && Number.isFinite(o.ltv) && o.nivel !== null)
    .sort((a, b) => (b.ltv ?? 0) - (a.ltv ?? 0))
    .map((o) => ({
      conta: `${o.simbolo} ${encurtar(o.conta, 4, 4)}`,
      ltv: Math.round((o.ltv ?? 0) * 1000) / 10,
      nivel: o.nivel ? t.nivel[o.nivel] : '',
      cor: o.nivel ? COR_NIVEL[o.nivel] : '#5c2eea',
      rotulo: percentual(o.ltv ?? 0, idioma),
    }))
  const gatilhos = (['alerta', 'recomposicao', 'realizacao'] as const).map((n) => ({
    valor: p[n] * 100,
    rotulo: percentual(p[n], idioma),
  }))
  const estresse = curvaDeEstresse(operacoes).map((ponto) => ({
    queda: Math.round(ponto.queda * 100),
    ltv: Math.round(ponto.ltv * 1000) / 10,
    rotuloQueda: percentual(ponto.queda, idioma),
    rotuloLtv: percentual(ponto.ltv, idioma),
    emMargem: ponto.emMargem,
    emLiquidacao: ponto.emLiquidacao,
  }))
  const faixas = (
    [
      ['entrada', `< ${percentual(p.alerta, idioma)}`],
      ['alerta', `${percentual(p.alerta, idioma)} a ${percentual(p.recomposicao, idioma)}`],
      ['recomposicao', `${percentual(p.recomposicao, idioma)} a ${percentual(p.realizacao, idioma)}`],
      ['realizacao', `≥ ${percentual(p.realizacao, idioma)}`],
    ] as const
  ).map(([nivel, faixa]) => ({
    nivel,
    rotulo: t.nivel[nivel],
    faixa,
    operacoes: resumo.porNivel[nivel].operacoes,
    valor: resumo.porNivel[nivel].dividaBRL,
    texto: brl(resumo.porNivel[nivel].dividaBRL, idioma),
  }))

  return (
    <>
      <SectionHeader
        titulo={t.visao.titulo}
        subtitulo={t.visao.subtitulo}
        acao={
          <BotaoLink href="/operacoes/nova">
            <Plus size={16} strokeWidth={2} aria-hidden />
            {t.operacoes.nova}
          </BotaoLink>
        }
      />

      <div className="grid grid-cols-4 gap-5">
        <KpiCard rotulo={t.visao.garantia} valor={brl(resumo.garantiaBRL, idioma)} icone={Lock} />
        <KpiCard rotulo={t.visao.divida} valor={brl(resumo.dividaBRL, idioma)} icone={Banknote} />
        <KpiCard rotulo={t.visao.ltvMedio} valor={resumo.ltv !== null ? percentual(resumo.ltv, idioma) : '0%'} icone={Gauge} />
        <KpiCard
          rotulo={t.visao.receita}
          valor={brl(resumo.receitaPrevista, idioma)}
          apoio={t.visao.receitaApoio}
          icone={TrendingUp}
        />
        <KpiCard
          rotulo={t.visao.ativasKpi}
          valor={String(resumo.ativas)}
          apoio={`${operacoes.length - resumo.ativas} ${t.visao.encerradas}`}
          icone={Layers}
        />
        <KpiCard
          rotulo={t.visao.emAlerta}
          valor={String(resumo.foraDoSaudavel)}
          apoio={`${t.visao.de} ${resumo.ativas} ${t.visao.ativas}`}
          icone={TriangleAlert}
        />
        <KpiCard
          rotulo={t.visao.folga}
          valor={resumo.menorFolga ? percentual(resumo.menorFolga.folga, idioma) : '0%'}
          apoio={t.visao.folgaApoio}
          icone={TrendingDown}
        />
        <KpiCard
          rotulo={t.visao.vencimento}
          valor={resumo.proximoVencimento ? (dataHora(resumo.proximoVencimento, idioma).split(',')[0] ?? '') : ''}
          icone={CalendarClock}
        />
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-5">
        <Card>
          <CardTitulo titulo={t.visao.estresse} ajuda={t.visao.estresseAjuda} />
          <GraficoEstresse
            pontos={estresse}
            gatilhos={[
              { valor: p.recomposicao * 100, rotulo: t.nivel.recomposicao },
              { valor: p.realizacao * 100, rotulo: t.nivel.realizacao },
            ]}
            t={{ quedaDePreco: t.visao.quedaDePreco, ltv: t.visao.ltvMedio, emMargem: t.visao.emMargem, emLiquidacao: t.visao.emLiquidacao }}
          />
        </Card>
        <Card>
          <CardTitulo titulo={t.visao.niveis} ajuda={t.visao.niveisAjuda} />
          <BarraNiveis faixas={faixas} rotuloOperacoes={t.visao.operacoes} />
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-5">
        <Card>
          <CardTitulo titulo={t.visao.cobertura} ajuda={t.visao.coberturaAjuda} />
          {barras.length > 0 ? (
            <GraficoCobertura barras={barras} gatilhos={gatilhos} />
          ) : (
            <p className="py-10 text-[15px] text-tinta-sub">{t.visao.coberturaVazia}</p>
          )}
        </Card>
        <div className="flex flex-col gap-5">
          <Card>
            <CardTitulo titulo={t.visao.porAtivo} />
            <BarrasValor
              barras={resumo.porAtivo.map((a) => ({
                rotulo: a.simbolo,
                icone: <IconeAtivo ativo={a.ativo} tamanho={26} />,
                apoio: `${a.operacoes} ${t.visao.operacoes}`,
                valor: a.garantiaBRL,
                texto: brl(a.garantiaBRL, idioma),
              }))}
            />
          </Card>
          <Card>
            <CardTitulo titulo={t.visao.porProduto} />
            <BarrasValor
              barras={resumo.porProduto.map((x) => ({
                rotulo: t.produto[x.produto],
                apoio: `${x.operacoes} ${t.visao.operacoes}`,
                valor: x.dividaBRL,
                texto: brl(x.dividaBRL, idioma),
              }))}
            />
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardTitulo
          titulo={t.visao.carteira}
          acao={
            <Link href="/operacoes" className="text-[14px] font-medium text-marca hover:text-marca-escuro">
              {t.visao.verTodas}
            </Link>
          }
        />
        <TabelaOperacoes operacoes={operacoes.slice(0, 8)} t={t} idioma={idioma} />
      </Card>
    </>
  )
}
