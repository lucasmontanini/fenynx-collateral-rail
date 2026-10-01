import Link from 'next/link'
import { simularPrecos, voltarAoMercado } from '@/app/acoes'
import { CardGarantia } from '@/components/CardGarantia'
import { FormAcao } from '@/components/FormAcao'
import { IconeAtivo } from '@/components/IconeAtivo'
import { LogoZuvia } from '@/components/LogoZuvia'
import { RotulosAtivo } from '@/components/RotulosAtivo'
import { Sparkline } from '@/components/graficos/Sparkline'
import { Badge, type Tom } from '@/components/ui/Badge'
import { Campo } from '@/components/ui/Campo'
import { Card } from '@/components/ui/Card'
import { CardTitulo } from '@/components/ui/CardTitulo'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { resumirCarteira } from '@/lib/domain/carteira'
import { TOKEN_TERRE02 } from '@/lib/domain/case'
import type { NivelCobertura } from '@/lib/domain/credito'
import { brl } from '@/lib/formato'
import { traducao } from '@/lib/i18n/servidor'
import { historicoDePreco } from '@/lib/precos'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'

const TOM: Record<NivelCobertura, Tom> = {
  entrada: 'sucesso',
  alerta: 'alerta',
  recomposicao: 'perigo',
  realizacao: 'perigoForte',
}

export default async function Monitoramento() {
  const { t, idioma } = await traducao()
  const [{ precos, operacoes }, historicoXRP, historicoBTC] = await Promise.all([
    painelDaRequisicao(),
    historicoDePreco('XRP'),
    historicoDePreco('BTC'),
  ])
  const resumo = resumirCarteira(operacoes)
  const monitoradas = operacoes
    .filter((o) => o.status === 'ativa' || o.status === 'aguardando')
    .sort((a, b) => (b.ltv ?? -1) - (a.ltv ?? -1))
  const historico = { XRP: historicoXRP, BTC: historicoBTC }

  return (
    <>
      <SectionHeader titulo={t.monitor.titulo} subtitulo={t.monitor.subtitulo} />

      <div className="grid grid-cols-4 gap-5">
        {(['entrada', 'alerta', 'recomposicao', 'realizacao'] as const).map((n) => (
          <div key={n} className="flex h-[92px] items-center justify-between rounded-cartao border border-borda bg-superficie px-5">
            <div>
              <div className="tabular text-[34px] font-semibold leading-none tracking-tight">{resumo.porNivel[n].operacoes}</div>
              <div className="tabular mt-1.5 text-[13px] text-tinta-sub">{brl(resumo.porNivel[n].dividaBRL, idioma)}</div>
            </div>
            <Badge tom={TOM[n]}>{t.nivel[n]}</Badge>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-5">
        <Card>
          <CardTitulo
            titulo={t.monitor.precos}
            acao={<Badge tom={precos.simulado ? 'alerta' : 'sucesso'}>{precos.simulado ? t.nav.simulado : t.nav.mercado}</Badge>}
          />
          <div className="grid grid-cols-3 gap-6">
            {(['XRP', 'BTC'] as const).map((ativo) => {
              const preco = precos[ativo]
              return (
                <div key={ativo}>
                  <div className="flex items-center gap-3">
                    <IconeAtivo ativo={ativo} tamanho={36} />
                    <RotulosAtivo ativo={ativo} t={t.rotulos} compacto />
                  </div>
                  <div className="tabular mt-2 text-[22px] font-semibold tracking-tight">
                    {preco ? brl(preco.valor, idioma) : t.visao.semPreco}
                  </div>
                  <div className="mt-2">
                    <Sparkline valores={historico[ativo].map((p) => p.valor)} rotulo={`${ativo} ${t.monitor.ultimos30}`} />
                  </div>
                  <div className="mt-1 text-[13px] leading-snug text-tinta-sub">
                    {preco?.fontes.map((f) => f.nome).join(', ')} · {t.monitor.ultimos30}
                  </div>
                  <Link href={`/garantias/${ativo.toLowerCase()}`} className="mt-2 inline-block text-[14px] font-medium text-marca hover:text-marca-escuro">
                    {t.ativo.verAtivo}
                  </Link>
                </div>
              )
            })}
            <div>
              <div className="flex items-center gap-3">
                <IconeAtivo ativo="MPT" tamanho={36} />
                <RotulosAtivo ativo="MPT" t={t.rotulos} compacto />
              </div>
              <div className="tabular mt-2 text-[22px] font-semibold tracking-tight">{brl(TOKEN_TERRE02.valorUnitario, idioma)}</div>
              <div className="mt-2 flex h-10 items-center">
                <LogoZuvia altura={22} />
              </div>
              <div className="mt-1 text-[13px] leading-snug text-tinta-sub">
                {TOKEN_TERRE02.ticker} · {t.monitor.referencia} · {TOKEN_TERRE02.plataforma}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <CardTitulo titulo={t.monitor.simular} ajuda={t.monitor.simularAjuda} />
          <FormAcao acao={simularPrecos} rotulo={t.monitor.aplicar} t={t.form} variante="secundaria">
            <div className="grid grid-cols-2 gap-3">
              <Campo rotulo="XRP" nome="XRP" tipo="number" opcional />
              <Campo rotulo="BTC" nome="BTC" tipo="number" opcional />
            </div>
          </FormAcao>
          {precos.simulado ? (
            <div className="mt-3">
              <FormAcao acao={voltarAoMercado} rotulo={t.monitor.voltar} t={t.form} variante="secundaria" />
            </div>
          ) : null}
        </Card>
      </div>

      {monitoradas.length > 0 ? (
        <div className="mt-5 grid grid-cols-3 gap-5">
          {monitoradas.map((op) => (
            <CardGarantia key={op.conta} op={op} t={t} idioma={idioma} />
          ))}
        </div>
      ) : (
        <Card className="mt-5">
          <p className="text-[15px] text-tinta-sub">{t.monitor.vazio}</p>
        </Card>
      )}
      <Card className="mt-5">
        <CardTitulo titulo={t.rotulos.legenda} />
        <dl className="grid grid-cols-4 gap-6">
          {(
            [
              ['XRP', 'marca', t.rotulos.xrp],
              ['BTC', 'marca', t.rotulos.btc],
              ['MPT', 'marca', t.rotulos.mpt],
              [t.rotulos.rwa, 'info', t.rotulos.rwaTexto],
            ] as const
          ).map(([selo, tom, texto]) => (
            <div key={selo}>
              <dt>
                <Badge tom={tom}>{selo}</Badge>
              </dt>
              <dd className="mt-2 text-[14px] leading-snug text-tinta-sub">{texto}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </>
  )
}
