import Link from 'next/link'
import type { ReactNode } from 'react'

export function BotaoLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-marca px-4 text-[15px] font-medium text-white transition-colors duration-150 hover:bg-marca-escuro"
    >
      {children}
    </Link>
  )
}
