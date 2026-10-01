import Image from 'next/image'

/** Logo oficial horizontal da Fenynx. Proporcao original 1226 por 246. */
export function Logo({ altura = 26 }: { altura?: number }) {
  return (
    <Image
      src="/logo-fenynx.svg"
      alt="Fenynx"
      width={Math.round((altura * 1226) / 246)}
      height={altura}
      priority
    />
  )
}
