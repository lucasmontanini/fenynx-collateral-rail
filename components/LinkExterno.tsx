import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

export function LinkExterno({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="tabular inline-flex items-center gap-1 text-[14px] text-marca hover:text-marca-escuro"
    >
      {children}
      <ArrowUpRight size={13} strokeWidth={1.75} aria-hidden />
    </a>
  )
}
