import { Banknote, CalendarClock, ChevronLeft, Gauge, Lock } from 'lucide-react'
import Link from 'next/link'
import { liberarExcedente, liquidarGarantia, reavaliarGarantia, reforcarGarantia, registrarPagamento } from '@/app/acoes'
import { BadgeNivel } from '@/components/BadgeNivel'
import { BadgeStatus } from '@/components/BadgeStatus'
import { DestaqueLastro } from '@/components/DestaqueLastro'
import { IconeAtivo } from '@/components/IconeAtivo'
import { FormAcao } from '@/components/FormAcao'
import { LinhaDoTempo } from '@/components/LinhaDoTempo'
import { LinkExterno } from '@/components/LinkExterno'
import { Passo } from '@/components/Passo'
import { RevelarCliente } from '@/components/RevelarCliente'
import { Campo } from '@/components/ui/Campo'
import { Card } from '@/components/ui/Card'
import { CardTitulo } from '@/components/ui/CardTitulo'
import { KpiCard } from '@/components/ui/KpiCard'
import { Medidor } from '@/components/ui/Medidor'
import { CASE_FENYNX } from '@/lib/domain/case'
import { brl, dataHora, encurtar, numero, percentual, quantidade, taxa } from '@/lib/formato'
import { traducao } from '@/lib/i18n/servidor'
import { carregarLastroVigente } from '@/lib/lastro/vigente'
import { EXPLORER } from '@/lib/xrpl/config'
import { carregarOperacao } from '@/lib/xrpl/leitura'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'
import { comLedger } from '@/lib/xrpl/servidor'

export default async function PaginaOperacao({ params }: { params: Promise<{ conta: string }> }) {
  const { conta } = await params
  const { t, idioma } = await traducao()
  const { precos, operacoes, integracao } = await painelDaRequisicao()
  const dados = await comLedger((ctx) => carregarOperacao(ctx, conta, precos))
  const voltar = (
    <Link href="/operacoes" className="mb-4 inline-flex items-center gap-1 text-[14px] text-tinta-sub hover:text-tinta">
      <ChevronLeft size={15} strokeWidth={1.75} aria-hidden />
      {t.operacao.voltar}
    </Link>
  )
  if (!dados) {
    return (
      <>
        {voltar}
        <Card>
          <p className="text-[15px] text-tinta-sub">{t.operacao.naoEncontrada}</p>
        </Card>
      </>
    )
  }

  const { operacao: lida, eventos } = dados
  // A versao do painel traz o vinculo com a API da Fenynx, quando existe.
  const op = operacoes.find((o) => o.conta === conta) ?? lida
  const lastro = op.ativo === 'MPT' ? await carregarLastroVigente() : null
  const preco = op.precoAtual
  const custodia = { XRP: t.operacao.custodiaXRP, BTC: t.operacao.custodiaBTC, MPT: t.operacao.custodiaMPT }[op.ativo]
  const ocultos = { conta }
  const tomMedidor = op.nivel === 'entrada' ? 'sucesso' : op.nivel === 'alerta' ? 'alerta' : 'perigo'
  const marcadores = (['entrada', 'alerta', 'recomposicao', 'realizacao'] as const).map((n) => ({
    posicao: CASE_FENYNX.ltv[n],
    rotulo: percentual(CASE_FENYNX.ltv[n], idioma),
  }))
  const queda = (alvo: number | null) => (alvo !== null && preco ? percentual(Math.max(0, 1 - alvo / preco), idioma) : '')
  const linha = 'flex items-baseline justify-between gap-4 border-b border-borda py-3 text-[15px] last:border-0'

  return (
    <>
      {voltar}
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <IconeAtivo ativo={op.ativo} tamanho={48} />
          <h1 className="tabular text-[34px] font-semibold leading-tight tracking-tight">
            {op.modelo ?? t.produto[op.produto]} · {encurtar(conta)}
          </h1>
          <BadgeStatus status={op.status} t={t.status} />
        </div>
        <div className="mt-1.5">
          <LinkExterno href={`${EXPLORER}/accounts/${conta}`}>{t.operacao.explorer}</LinkExterno>
        </div>
      </header>

      {lastro ? <DestaqueLastro score={lastro.score} obra={lastro.vigente.obra} t={t.lastro} idioma={idioma} /> : null}

      <div className="grid grid-cols-4 gap-5">
        <KpiCard
          rotulo={t.operacao.garantia}
          valor={op.ativo === 'MPT' ? numero(op.garantiaQtd, idioma, 0) : quantidade(op.garantiaQtd, op.ativo, idioma)}
          apoio={[op.ativo === 'MPT' ? op.simbolo : null, op.garantiaBRL !== null ? brl(op.garantiaBRL, idioma) : null]
            .filter(Boolean)
            .join(' · ')}
          icone={Lock}
        />
        <KpiCard
          rotulo={t.operacao.divida}
          valor={brl(op.saldoDevedor, idioma)}
          apoio={`${brl(op.totalNoVencimento, idioma)} ${t.operacao.totalVencimento}`}
          icone={Banknote}
        />
        <KpiCard
          rotulo={t.operacao.ltv}
          valor={op.ltv !== null ? percentual(op.ltv, idioma) : '0%'}
          apoio={op.nivel ? t.nivel[op.nivel] : undefined}
          icone={Gauge}
        />
        <KpiCard
          rotulo={t.operacao.vencimento}
          valor={dataHora(op.vencimento, idioma).split(',')[0] ?? ''}
          apoio={`${op.meses} ${t.nova.meses}`}
          icone={CalendarClock}
        />
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-5">
        <div className="flex flex-col gap-5">
          {op.ltv !== null && op.nivel ? (
            <Card>
              <CardTitulo
                titulo={t.operacao.cobertura}
                ajuda={custodia}
                acao={<BadgeNivel nivel={op.nivel} t={t.nivel} />}
              />
              <Medidor valor={op.ltv} tom={tomMedidor} marcadores={marcadores} rotulo={t.operacao.ltv} />
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[13px] text-tinta-sub">{t.operacao.precoAtual}</div>
                  <div className="tabular text-[17px] font-semibold">{preco ? brl(preco, idioma) : ''}</div>
                </div>
                <div>
                  <div className="text-[13px] text-tinta-sub">{t.operacao.margem}</div>
                  <div className="tabular text-[17px] font-semibold">{op.precoMargem ? brl(op.precoMargem, idioma) : ''}</div>
                  <div className="tabular text-[13px] text-tinta-sub">
                    {t.operacao.queda} {queda(op.precoMargem)}
                  </div>
                </div>
                <div>
                  <div className="text-[13px] text-tinta-sub">{t.operacao.liquidacao}</div>
                  <div className="tabular text-[17px] font-semibold">
                    {op.precoLiquidacao ? brl(op.precoLiquidacao, idioma) : ''}
                  </div>
                  <div className="tabular text-[13px] text-tinta-sub">
                    {t.operacao.queda} {queda(op.precoLiquidacao)}
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardTitulo titulo={t.operacao.acoes} />
            {op.status === 'ativa' || op.status === 'aguardando' ? (
              <div className="flex flex-col gap-4">
                {op.nivel === 'realizacao' ? (
                  <Passo titulo={t.operacao.liquidarTitulo} ajuda={t.operacao.liquidarAjuda}>
                    <FormAcao acao={liquidarGarantia} rotulo={t.operacao.liquidar} t={t.form} variante="perigo" ocultos={ocultos} />
                  </Passo>
                ) : null}
                {op.ativo === 'MPT' ? (
                  <Passo titulo={t.operacao.reavaliarTitulo} ajuda={t.operacao.reavaliarAjuda}>
                    <FormAcao acao={reavaliarGarantia} rotulo={t.operacao.reavaliar} t={t.form} variante="secundaria" ocultos={ocultos}>
                      <Campo rotulo={t.operacao.valorUnitario} nome="valorUnitario" tipo="number" valorInicial={preco ? String(preco) : ''} />
                    </FormAcao>
                  </Passo>
                ) : null}
                <Passo titulo={t.operacao.reforcarTitulo} ajuda={t.operacao.reforcarAjuda}>
                  <FormAcao acao={reforcarGarantia} rotulo={t.operacao.reforcar} t={t.form} variante="secundaria" ocultos={ocultos}>
                    <Campo rotulo={`${t.operacao.quantidade} ${op.simbolo}`} nome="quantidade" tipo="number" />
                  </FormAcao>
                </Passo>
                <Passo titulo={t.operacao.pagarTitulo} ajuda={t.operacao.pagarAjuda}>
                  <FormAcao acao={registrarPagamento} rotulo={t.operacao.pagar} t={t.form} ocultos={ocultos}>
                    <Campo rotulo={t.operacao.valor} nome="valor" tipo="number" />
                  </FormAcao>
                  <div className="mt-3">
                    <FormAcao
                      acao={registrarPagamento}
                      rotulo={t.operacao.quitar}
                      t={t.form}
                      variante="secundaria"
                      ocultos={{ conta, quitar: 'sim' }}
                    />
                  </div>
                </Passo>
                <Passo
                  titulo={t.operacao.liberarTitulo}
                  ajuda={`${t.operacao.liberarAjuda} ${t.operacao.liberavel}: ${quantidade(op.liberavel, op.ativo, idioma, op.simbolo)}.`}
                >
                  <FormAcao
                    acao={liberarExcedente}
                    rotulo={t.operacao.liberar}
                    t={t.form}
                    variante="secundaria"
                    ocultos={ocultos}
                    desabilitado={op.liberavel <= 0}
                  />
                </Passo>
                {op.nivel !== 'realizacao' ? (
                  <Passo titulo={t.operacao.liquidarTitulo} ajuda={t.operacao.liquidarBloqueado}>
                    <FormAcao acao={liquidarGarantia} rotulo={t.operacao.liquidar} t={t.form} variante="perigo" ocultos={ocultos} desabilitado />
                  </Passo>
                ) : null}
              </div>
            ) : (
              <p className="text-[15px] text-tinta-sub">{t.operacao.encerrada}</p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardTitulo titulo={t.operacao.contrato} />
            <div className={linha}>
              <span className="text-tinta-sub">{t.operacao.principal}</span>
              <span className="tabular">{brl(op.principal, idioma)}</span>
            </div>
            <div className={linha}>
              <span className="text-tinta-sub">{t.operacao.tac}</span>
              <span className="tabular">{brl(op.tac, idioma)}</span>
            </div>
            <div className={linha}>
              <span className="text-tinta-sub">{t.operacao.taxa}</span>
              <span className="tabular">{taxa(op.taxaMensal, idioma)}</span>
            </div>
            <div className={linha}>
              <span className="text-tinta-sub">{t.operacao.pago}</span>
              <span className="tabular">{brl(op.pago, idioma)}</span>
            </div>
          </Card>
          <Card>
            <CardTitulo titulo={t.cliente.titulo} ajuda={integracao.configurada ? t.cliente.ajuda : undefined} />
            {op.cliente && op.fenynx ? (
              <>
                <div className="text-[14px] text-tinta-sub">{t.cliente.codigo}</div>
                <div className="tabular mb-4 text-[22px] font-semibold tracking-tight">{op.cliente}</div>
                <div className={linha}>
                  <span className="text-tinta-sub">{t.cliente.ltvFenynx}</span>
                  <span className="tabular">{percentual(op.fenynx.ltv, idioma)}</span>
                </div>
                <div className={`${linha} mb-4`}>
                  <span className="text-tinta-sub">{t.cliente.saldoFenynx}</span>
                  <span className="tabular">{brl(op.fenynx.saldoDevedor, idioma)}</span>
                </div>
                <RevelarCliente emprestimo={op.fenynx.id} t={t.cliente} falhou={t.form.falhou} />
              </>
            ) : (
              <p className="text-[15px] leading-snug text-tinta-sub">
                {integracao.configurada ? t.cliente.semVinculo : t.cliente.semIntegracao}
              </p>
            )}
          </Card>
          <Card>
            <CardTitulo titulo={t.operacao.linhaDoTempo} />
            <LinhaDoTempo eventos={eventos} explorer={EXPLORER} t={t.evento} idioma={idioma} />
          </Card>
        </div>
      </div>
    </>
  )
}
