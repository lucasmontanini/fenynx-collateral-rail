import { definirIdioma, inicializarAmbiente, sair } from '@/app/acoes'
import { BadgeNivel } from '@/components/BadgeNivel'
import { FormAcao } from '@/components/FormAcao'
import { LinkExterno } from '@/components/LinkExterno'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { CardTitulo } from '@/components/ui/CardTitulo'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CASE_FENYNX } from '@/lib/domain/case'
import { encurtar, numero, percentual } from '@/lib/formato'
import { traducao } from '@/lib/i18n/servidor'
import { EXPLORER } from '@/lib/xrpl/config'
import { carregarContas } from '@/lib/xrpl/leitura'
import { painelDaRequisicao } from '@/lib/xrpl/requisicao'
import { comLedger } from '@/lib/xrpl/servidor'

export default async function Config() {
  const { t, idioma } = await traducao()
  const [contas, { integracao }] = await Promise.all([comLedger(carregarContas), painelDaRequisicao()])
  const th = 'pb-3 text-left text-[13px] font-medium text-tinta-sub'
  const opcao = (valor: 'pt' | 'en', rotulo: string) => (
    <button
      type="submit"
      name="idioma"
      value={valor}
      aria-pressed={idioma === valor}
      className={`h-10 rounded-[10px] px-5 text-[15px] font-medium transition-colors duration-150 ${
        idioma === valor
          ? 'bg-marca text-white'
          : 'border border-borda-forte bg-superficie text-tinta hover:border-marca hover:text-marca'
      }`}
    >
      {rotulo}
    </button>
  )
  return (
    <>
      <SectionHeader titulo={t.config.titulo} subtitulo={t.config.subtitulo} />
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardTitulo titulo={t.config.idioma} ajuda={t.config.idiomaAjuda} />
          <form action={definirIdioma} className="flex gap-3">
            {opcao('pt', t.config.portugues)}
            {opcao('en', t.config.ingles)}
          </form>
        </Card>
        <Card>
          <CardTitulo titulo={t.config.politica} ajuda={t.config.politicaAjuda} />
          <div className="grid grid-cols-4 gap-3">
            {(['entrada', 'alerta', 'recomposicao', 'realizacao'] as const).map((n) => (
              <div key={n}>
                <div className="tabular mb-2 text-[22px] font-semibold tracking-tight">
                  {percentual(CASE_FENYNX.ltv[n], idioma)}
                </div>
                <BadgeNivel nivel={n} t={t.nivel} />
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="mt-5">
        <CardTitulo
          titulo={t.cliente.integracao}
          ajuda={t.cliente.integracaoAjuda}
          acao={
            <Badge tom={integracao.erro ? 'perigo' : integracao.configurada ? 'sucesso' : 'neutro'}>
              {integracao.erro ? t.cliente.comErro : integracao.configurada ? t.cliente.configurada : t.cliente.naoConfigurada}
            </Badge>
          }
        />
        <p className="tabular text-[15px] text-tinta-700">
          {integracao.erro ??
            (integracao.configurada ? `${integracao.emprestimos} ${t.cliente.emprestimos}` : t.cliente.variaveis)}
        </p>
      </Card>
      <Card className="mt-5">
        <CardTitulo titulo={t.config.contas} />
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-borda">
              <th className={th}>{t.config.papel}</th>
              <th className={th}>{t.config.endereco}</th>
              <th className={`${th} text-right`}>XRP</th>
            </tr>
          </thead>
          <tbody>
            {contas.map((c) => (
              <tr key={c.papel} className="h-12 border-b border-borda last:border-0">
                <td className="text-[15px] text-tinta">{t.config.papeis[c.papel]}</td>
                <td>
                  <LinkExterno href={`${EXPLORER}/accounts/${c.endereco}`}>{encurtar(c.endereco, 8, 6)}</LinkExterno>
                </td>
                <td className="tabular text-right text-[15px]">{numero(c.xrp, idioma)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="mt-5 grid grid-cols-2 gap-5">
        <Card>
          <CardTitulo titulo={t.config.ambiente} ajuda={t.config.reiniciarAjuda} />
          <FormAcao acao={inicializarAmbiente} rotulo={t.config.reiniciar} t={t.form} variante="secundaria" />
        </Card>
        <Card>
          <CardTitulo titulo={t.config.sessao} />
          <form action={sair}>
            <button
              type="submit"
              className="h-10 rounded-[10px] border border-borda-forte bg-superficie px-4 text-[15px] font-medium text-tinta transition-colors duration-150 hover:border-marca hover:text-marca"
            >
              {t.nav.sair}
            </button>
          </form>
        </Card>
      </div>
    </>
  )
}
