import { createHmac } from 'node:crypto'

/**
 * Codigo estavel do cliente, derivado do documento com uma chave secreta.
 * Sem a chave nao da para voltar ao documento nem testar documentos por tentativa.
 * O codigo nunca vai para o ledger: ele continua sendo dado pessoal para quem tem a chave.
 */
export function pseudonimo(identificador: string, segredo: string | undefined = process.env.PRIVACIDADE_SEGREDO): string {
  if (!segredo) throw new Error('PRIVACIDADE_SEGREDO ausente')
  const limpo = identificador.replace(/\D/g, '') || identificador.trim().toLowerCase()
  const resumo = createHmac('sha256', segredo).update(limpo).digest('hex').toUpperCase()
  return `CLI ${resumo.slice(0, 4)} ${resumo.slice(4, 8)}`
}

/** Lucas Montanini vira L**** M********. */
export function mascararNome(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .map((parte) => (parte.length <= 1 ? parte : parte[0] + '*'.repeat(parte.length - 1)))
    .join(' ')
}

/** Mantem so os dois ultimos digitos do documento. */
export function mascararDocumento(documento: string): string {
  const digitos = documento.replace(/\D/g, '')
  return digitos.length < 3 ? '*'.repeat(digitos.length) : '*'.repeat(digitos.length - 2) + digitos.slice(-2)
}
