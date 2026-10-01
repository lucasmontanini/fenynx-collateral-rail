import { simularPrecos, voltarAoMercado } from '@/app/acoes'
import { CardGarantia } from '@/components/CardGarantia'
import { CardPreco } from '@/components/CardPreco'
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
import { TOKENS_BRUMMEL, TOKEN_TERRE02 } from '@/lib/domain/case'
import type { NivelCobertura } from '@/lib/domain/credito'
import { brl, taxa } from '@/lib/formato'
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
  // Valor vigente de um token da cesta: a ultima avaliacao registrada em alguma operacao.
  const valorDoToken = (ticker: string, padrao: number): number =>
    operacoes.flatMap((o) => o.itens ?? []).find((i) => i.chave === ticker)?.precoUnitario ?? padrao

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

      <h2 className="mb-4 mt-10 text-[19px] font-semibold text-tinta">{t.monitor.precos}</h2>
      <div className="grid grid-cols-3 gap-5">
        {(['XRP', 'BTC'] as const).map((ativo) => {
          const preco = precos[ativo]
          const serie = historico[ativo].map((p) => p.valor)
          const primeiro = serie[0]
          const ultimo = serie[serie.length - 1]
          return (
            <CardPreco
              key={ativo}
              icone={<IconeAtivo ativo={ativo} tamanho={46} />}
              simbolo={ativo}
              nome={ativo === 'XRP' ? 'XRP Ledger' : 'Bitcoin'}
              rotulos={<RotulosAtivo ativo={ativo} t={t.rotulos} />}
              valor={preco ? brl(preco.valor, idioma) : t.visao.semPreco}
              origem={precos.simulado ? t.nav.simulado : t.nav.mercado}
              tomOrigem={precos.simulado ? 'alerta' : 'sucesso'}
              apoio={primeiro && ultimo ? `${taxa(ultimo / primeiro - 1, idioma)} ${t.monitor.em30}` : undefined}
              grafico={<Sparkline valores={serie} rotulo={`${ativo} ${t.monitor.ultimos30}`} />}
              fonte={preco?.fontes.map((f) => f.nome).join(', ') ?? ''}
              link={{ href: `/garantias/${ativo.toLowerCase()}`, rotulo: t.ativo.verAtivo }}
            />
          )
        })}
        <CardPreco
          icone={<IconeAtivo ativo="MPT" tamanho={46} classe="imovel" />}
          simbolo={TOKEN_TERRE02.ticker}
          nome={`${TOKEN_TERRE02.emissor} · ${TOKEN_TERRE02.plataforma}`}
          rotulos={<RotulosAtivo ativo="MPT" t={t.rotulos} classe="imovel" />}
          valor={brl(TOKEN_TERRE02.valorUnitario, idioma)}
          origem={t.monitor.avaliacao}
          tomOrigem="info"
          grafico={<LogoZuvia altura={24} />}
          fonte={t.monitor.referencia}
          link={{ href: '/lastro', rotulo: t.lastro.verLastro }}
        />
        {TOKENS_BRUMMEL.map((token) => (
          <CardPreco
            key={token.ticker}
            icone={<IconeAtivo ativo="MPT" tamanho={46} classe={token.classe} />}
            simbolo={token.ticker}
            nome={token.nome}
            rotulos={<RotulosAtivo ativo="MPT" t={t.rotulos} classe={token.classe} />}
            valor={brl(valorDoToken(token.ticker, token.valorUnitario), idioma)}
            origem={t.monitor.avaliacao}
            tomOrigem="info"
            fonte={token.emissor}
            link={{ href: `/tokens/${token.ticker}`, rotulo: t.cesta.verToken }}
          />
        ))}
        <Card className="flex h-full flex-col">
          <CardTitulo
            titulo={t.monitor.simular}
            ajuda={t.monitor.simularAjuda}
          />
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

      <h2 className="mb-4 mt-10 text-[19px] font-semibold text-tinta">{t.nav.operacoes}</h2>
      {monitoradas.length > 0 ? (
        <div className="grid grid-cols-3 gap-5">
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
