import type { Metadata } from 'next'
import { Work_Sans } from 'next/font/google'
import type { ReactNode } from 'react'
import { idiomaAtual } from '@/lib/i18n/servidor'
import './globals.css'

const workSans = Work_Sans({ subsets: ['latin'], variable: '--font-work-sans' })

export const metadata: Metadata = {
  title: 'Fenynx Collateral Rail',
  description: 'Trilho de garantia da Fenynx na XRP Ledger',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={(await idiomaAtual()) === 'en' ? 'en' : 'pt-BR'} className={workSans.variable}>
      <body>{children}</body>
    </html>
  )
}
