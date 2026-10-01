import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-cartao border border-borda bg-superficie p-7 shadow-cartao ${className}`}>
      {children}
    </section>
  )
}
