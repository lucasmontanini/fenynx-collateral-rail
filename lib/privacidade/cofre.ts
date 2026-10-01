import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

/**
 * Cifra de dados pessoais em repouso. AES 256 GCM, chave em PRIVACIDADE_CHAVE (64 caracteres hex).
 * Formato do texto cifrado: iv.tag.dados, tudo em base64url.
 * Apagar a chave torna tudo o que foi cifrado com ela irrecuperavel.
 */
function chave(hex: string | undefined = process.env.PRIVACIDADE_CHAVE): Buffer {
  if (!hex || !/^[0-9a-fA-F]{64}$/.test(hex)) throw new Error('PRIVACIDADE_CHAVE ausente ou invalida')
  return Buffer.from(hex, 'hex')
}

export function cifrar(texto: string, chaveHex?: string): string {
  const iv = randomBytes(12)
  const cifra = createCipheriv('aes-256-gcm', chave(chaveHex), iv)
  const dados = Buffer.concat([cifra.update(texto, 'utf8'), cifra.final()])
  return [iv, cifra.getAuthTag(), dados].map((b) => b.toString('base64url')).join('.')
}

export function decifrar(cifrado: string, chaveHex?: string): string {
  const [iv, tag, dados] = cifrado.split('.')
  if (!iv || !tag || !dados) throw new Error('Texto cifrado em formato invalido')
  const decifra = createDecipheriv('aes-256-gcm', chave(chaveHex), Buffer.from(iv, 'base64url'))
  decifra.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decifra.update(Buffer.from(dados, 'base64url')), decifra.final()]).toString('utf8')
}
