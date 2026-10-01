import { readFileSync, writeFileSync } from 'node:fs'

interface Linha {
  etapa: string
  passo: string
  tipo: string
  conta: string
  hash: string
  link: string
}

interface Registro {
  rede: string
  executadoEm: string
  contas: Record<string, string>
  vaultId: string
  brokerId: string
  operacoes: Record<string, string>
  emprestimos: Record<string, string>
  mpt: string
  notas: string[]
  transacoes: Linha[]
}

/** Gera docs/SPIKE_XRPL.md a partir do registro real da ultima execucao. */
function main(): void {
  const r = JSON.parse(readFileSync('docs/spike-devnet.json', 'utf8')) as Registro
  const md: string[] = [
    '# Spike XRPL na Devnet',
    '',
    `Execucao de ${r.executadoEm} em ${r.rede}. ${r.transacoes.length} transacoes validadas.`,
    'Gerado por `npm run relatorio` a partir de `docs/spike-devnet.json`. Nada aqui e simulado.',
    '',
    '## Objetos no ledger',
    '',
    `- Vault: \`${r.vaultId}\``,
    `- Loan broker: \`${r.brokerId}\``,
    `- MPT de colateral: \`${r.mpt}\``,
    ...Object.entries(r.emprestimos).map(([op, id]) => `- Emprestimo ${op}: \`${id}\``),
    ...Object.entries(r.operacoes).map(([op, conta]) => `- Conta da operacao ${op}: \`${conta}\``),
    '',
    '## Contas de teste',
    '',
    ...Object.entries(r.contas).map(([papel, endereco]) => `- ${papel}: \`${endereco}\``),
    '',
    '## Resultados medidos',
    '',
    ...r.notas.map((n) => `- ${n}`),
    '',
  ]
  let etapaAtual = ''
  for (const t of r.transacoes) {
    if (t.etapa !== etapaAtual) {
      etapaAtual = t.etapa
      md.push(`## ${etapaAtual}`, '', '| Passo | Transacao | Hash |', '|---|---|---|')
    }
    md.push(`| ${t.passo} | ${t.tipo} | [${t.hash.slice(0, 12)}](${t.link}) |`)
  }
  writeFileSync('docs/SPIKE_XRPL.md', `${md.join('\n')}\n`)
  console.log('docs/SPIKE_XRPL.md gerado')
}

main()
