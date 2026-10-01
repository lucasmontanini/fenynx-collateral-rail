import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { CardTitulo } from '@/components/ui/CardTitulo'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { traducao } from '@/lib/i18n/servidor'
import { carregarAmendments } from '@/lib/xrpl/leitura'

export default async function Rede() {
  const { t } = await traducao()
  const amendments = await carregarAmendments()
  const ativa = (nome: string, rede: 'devnet' | 'mainnet') => amendments.find((a) => a.nome === nome)?.[rede] ?? false
  // XLS so onde existe uma. Multisig, pagamento e memo sao do nucleo do protocolo e nao tem numero de XLS.
  const noLedger: { rotulo: string; recurso: string; amendment: string | null }[] = [
    { rotulo: t.rede.p1, recurso: t.rede.nucleoMultisign, amendment: null },
    { rotulo: t.rede.p2, recurso: t.rede.nucleoPagamento, amendment: null },
    { rotulo: t.rede.p2b, recurso: 'XLS 33 · MPTokensV1', amendment: 'MPTokensV1' },
    { rotulo: t.rede.p3, recurso: t.rede.nucleoMemo, amendment: null },
    { rotulo: t.rede.p4, recurso: 'XLS 47 · PriceOracle', amendment: 'PriceOracle' },
  ]
  const fora = [t.rede.p5, t.rede.p6, t.rede.p7]
  const th = 'pb-3 text-left text-[13px] font-medium text-tinta-sub'
  const selo = (ok: boolean) => <Badge tom={ok ? 'sucesso' : 'alerta'}>{ok ? t.rede.ativo : t.rede.inativo}</Badge>
  return (
    <>
      <SectionHeader titulo={t.rede.titulo} subtitulo={t.rede.subtitulo} />
      <Card>
        <CardTitulo titulo={t.rede.partes} />
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-borda">
              <th className={th}>{t.rede.usadoEm}</th>
              <th className={th}>{t.rede.padrao}</th>
              <th className={`${th} w-36`}>{t.rede.devnet}</th>
              <th className={`${th} w-36`}>{t.rede.mainnet}</th>
            </tr>
          </thead>
          <tbody>
            {noLedger.map((p) => (
              <tr key={p.rotulo} className="h-14 border-b border-borda">
                <td className="text-[15px] text-tinta">{p.rotulo}</td>
                <td className="text-[14px] text-tinta-sub">{p.recurso}</td>
                <td>{selo(p.amendment ? ativa(p.amendment, 'devnet') : true)}</td>
                <td>{selo(p.amendment ? ativa(p.amendment, 'mainnet') : true)}</td>
              </tr>
            ))}
            {fora.map((rotulo) => (
              <tr key={rotulo} className="h-14 border-b border-borda last:border-0">
                <td className="text-[15px] text-tinta">{rotulo}</td>
                <td className="text-[14px] text-tinta-sub">{t.rede.foraDoLedger}</td>
                <td />
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="mt-5">
        <CardTitulo titulo={t.rede.semVault} ajuda={t.rede.semVaultTexto} acao={<Badge>{t.rede.foraDeUso}</Badge>} />
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-borda">
              <th className={th}>{t.rede.recurso}</th>
              <th className={`${th} w-36`}>{t.rede.devnet}</th>
              <th className={`${th} w-36`}>{t.rede.mainnet}</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ['SingleAssetVault', 'XLS 65'],
                ['LendingProtocol', 'XLS 66'],
              ] as const
            ).map(([nome, xls]) => (
              <tr key={nome} className="h-12 border-b border-borda last:border-0">
                <td className="text-[15px] text-tinta">
                  {xls} · {nome}
                </td>
                <td>{selo(ativa(nome, 'devnet'))}</td>
                <td>{selo(ativa(nome, 'mainnet'))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}
