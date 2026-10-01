import Image from 'next/image'

/** Logo da Zuvia, plataforma que distribui o token. Proporcao original 139 por 36. */
export function LogoZuvia({ altura = 22 }: { altura?: number }) {
  return <Image src="/ativos/zuvia.svg" alt="Zuvia" width={Math.round((altura * 139) / 36)} height={altura} />
}
