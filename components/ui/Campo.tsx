import type { ReactNode } from 'react'

const BASE =
  'tabular h-10 w-full rounded-[10px] border border-borda-forte bg-superficie px-3 text-[15px] text-tinta placeholder:text-tinta-suave focus:border-marca focus:outline-none'

export function Campo({
  rotulo,
  nome,
  tipo = 'text',
  valorInicial,
  dica,
  opcional = false,
  children,
}: {
  rotulo: string
  nome: string
  tipo?: 'text' | 'email' | 'password' | 'number'
  valorInicial?: string
  dica?: string
  opcional?: boolean
  /** Opcoes de um select. Quando presente o campo vira lista. */
  children?: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-medium text-tinta-700">{rotulo}</span>
      {children ? (
        <select name={nome} defaultValue={valorInicial} className={BASE}>
          {children}
        </select>
      ) : (
        <input
          name={nome}
          type={tipo}
          defaultValue={valorInicial}
          step={tipo === 'number' ? 'any' : undefined}
          min={tipo === 'number' ? '0' : undefined}
          required={!opcional}
          autoComplete={tipo === 'password' ? 'current-password' : tipo === 'email' ? 'email' : 'off'}
          className={BASE}
        />
      )}
      {dica ? <span className="mt-1 block text-[13px] text-tinta-sub">{dica}</span> : null}
    </label>
  )
}
