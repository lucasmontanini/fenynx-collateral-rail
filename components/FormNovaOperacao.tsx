'use client'

import { LoaderCircle } from 'lucide-react'
import { useActionState, useState } from 'react'
import { criarOperacao } from '@/app/acoes'
import { CASE_FENYNX, MODELO_IPHONE_PADRAO, TOKEN_TERRE02, type Ativo, type Produto } from '@/lib/domain/case'
import { financiar, garantiaNecessaria, totalNoPrazo } from '@/lib/domain/operacao'
import { brl, percentual, quantidade, taxa } from '@/lib/formato'
import type { Dicionario, Idioma } from '@/lib/i18n/dicionario'
import { IconeAtivo } from './IconeAtivo'

const CAMPO =
  'tabular h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-[15px] text-tinta focus:border-marca focus:outline-none'
const ROTULO = 'mb-1.5 block text-[14px] font-medium text-tinta-700'

/** Simulador e abertura de operacao. Mesmo calculo que o servidor repete ao gravar. */
export function FormNovaOperacao({
  precos,
  t,
  idioma,
}: {
  precos: Record<Ativo, number | null>
  t: Dicionario
  idioma: Idioma
}) {
  const [estado, enviar, pendente] = useActionState(criarOperacao, null)
  const [produto, setProduto] = useState<Produto>('iphone')
  const [modeloId, setModeloId] = useState<string>(MODELO_IPHONE_PADRAO.id)
  const [valor, setValor] = useState(String(CASE_FENYNX.credito.valorPadrao))
  const [ativo, setAtivo] = useState<Ativo>('XRP')
  const [ltv, setLtv] = useState(0.5)

  const regras = CASE_FENYNX[produto]
  const modelo = CASE_FENYNX.iphone.modelos.find((m) => m.id === modeloId) ?? MODELO_IPHONE_PADRAO
  const principal = produto === 'iphone' ? modelo.precoBRL : Number(valor.replace(',', '.')) || 0
  const { tac, financiado } = financiar(principal, regras.tac)
  const total = totalNoPrazo(financiado, regras.taxaMensal, regras.meses)
  const preco = precos[ativo]
  const simbolo = ativo === 'MPT' ? TOKEN_TERRE02.ticker : ativo
  const garantia = preco ? garantiaNecessaria(financiado, preco, ltv) : null
  const precoEm = (gatilho: number) => (garantia ? financiado / (garantia * gatilho) : null)
  const erros: Record<string, string> = t.form.erros
  const linha = 'flex items-baseline justify-between gap-4 border-b border-borda py-3 last:border-0'

  return (
    <form action={enviar} className="grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-start gap-5">
      <section className="space-y-4 rounded-cartao border border-borda bg-superficie p-6">
        <label className="block">
          <span className={ROTULO}>{t.nova.produto}</span>
          <select name="produto" value={produto} onChange={(e) => setProduto(e.target.value === 'iphone' ? 'iphone' : 'credito')} className={CAMPO}>
            <option value="iphone">{t.produto.iphone}</option>
            <option value="credito">{t.produto.credito}</option>
          </select>
        </label>
        {produto === 'iphone' ? (
          <label className="block">
            <span className={ROTULO}>{t.nova.modelo}</span>
            <select name="modelo" value={modeloId} onChange={(e) => setModeloId(e.target.value)} className={CAMPO}>
              {CASE_FENYNX.iphone.modelos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className={ROTULO}>{t.nova.valor}</span>
            <input name="principal" type="number" min="0" step="any" required value={valor} onChange={(e) => setValor(e.target.value)} className={CAMPO} />
          </label>
        )}
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={ROTULO}>{t.nova.ativo}</span>
            <select name="ativo" value={ativo} onChange={(e) => setAtivo(e.target.value === 'BTC' || e.target.value === 'MPT' ? e.target.value : 'XRP')} className={CAMPO}>
              <option value="XRP">XRP</option>
              <option value="BTC">Bitcoin</option>
              <option value="MPT">{t.nova.tokenOpcao}</option>
            </select>
          </label>
          <label className="block">
            <span className={ROTULO}>{t.nova.ltv}</span>
            <select name="ltv" value={String(ltv)} onChange={(e) => setLtv(Number(e.target.value))} className={CAMPO}>
              {CASE_FENYNX.opcoesLtvEntrada.map((o) => (
                <option key={o} value={String(o)}>
                  {percentual(o, idioma)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[14px] leading-snug text-tinta-sub">{ativo === 'XRP' ? t.nova.notaXRP : ativo === 'BTC' ? t.nova.notaBTC : t.nova.notaMPT}</p>
        <button
          type="submit"
          disabled={pendente || !preco || principal <= 0}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-marca px-4 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-marca-escuro disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendente ? <LoaderCircle size={16} className="animate-spin" aria-hidden /> : null}
          {pendente ? t.form.pendente : t.nova.abrir}
        </button>
        {estado && !estado.ok && !pendente ? (
          <p role="status" className="break-words text-[14px] leading-snug text-perigo">
            {t.form.falhou}. {erros[estado.erro] ?? estado.erro}
          </p>
        ) : null}
      </section>

      <section className="rounded-cartao border border-borda bg-superficie p-6">
        <h2 className="mb-3 text-[16px] font-semibold">{t.nova.resumo}</h2>
        <div className="mb-4 grid grid-cols-2 gap-5">
          <div>
            <div className="mb-1 flex items-center gap-2.5 text-[14px] text-tinta-sub">
              <IconeAtivo ativo={ativo} tamanho={28} />
              {t.nova.garantia}
            </div>
            <div className="tabular text-[28px] font-semibold tracking-tight text-marca">
              {garantia ? quantidade(garantia, ativo, idioma, simbolo) : t.visao.semPreco}
            </div>
            <div className="tabular text-[13px] text-tinta-sub">
              {t.nova.precoAtual} {preco ? brl(preco, idioma) : ''}
            </div>
          </div>
          <div>
            <div className="text-[14px] text-tinta-sub">{t.nova.total}</div>
            <div className="tabular text-[28px] font-semibold tracking-tight">{brl(total, idioma)}</div>
            <div className="tabular text-[13px] text-tinta-sub">
              {regras.meses} {t.nova.meses}
            </div>
          </div>
        </div>
        <div className="text-[15px]">
          <div className={linha}>
            <span className="text-tinta-sub">{produto === 'iphone' ? t.nova.aparelho : t.nova.principal}</span>
            <span className="tabular">{brl(principal, idioma)}</span>
          </div>
          <div className={linha}>
            <span className="text-tinta-sub">
              {t.nova.tac} {percentual(regras.tac, idioma)}
            </span>
            <span className="tabular">{brl(tac, idioma)}</span>
          </div>
          <div className={linha}>
            <span className="text-tinta-sub">{t.nova.financiado}</span>
            <span className="tabular font-medium">{brl(financiado, idioma)}</span>
          </div>
          <div className={linha}>
            <span className="text-tinta-sub">{t.nova.taxa}</span>
            <span className="tabular">{taxa(regras.taxaMensal, idioma)}</span>
          </div>
          <div className={linha}>
            <span className="text-tinta-sub">{t.nova.margem}</span>
            <span className="tabular">{brl(precoEm(CASE_FENYNX.ltv.recomposicao) ?? 0, idioma)}</span>
          </div>
          <div className={linha}>
            <span className="text-tinta-sub">{t.nova.liquidacao}</span>
            <span className="tabular">{brl(precoEm(CASE_FENYNX.ltv.realizacao) ?? 0, idioma)}</span>
          </div>
        </div>
      </section>
    </form>
  )
}
