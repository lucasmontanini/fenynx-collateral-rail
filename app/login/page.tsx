import { entrar } from '@/app/acoes'
import { FormAcao } from '@/components/FormAcao'
import { Logo } from '@/components/Logo'
import { Campo } from '@/components/ui/Campo'
import { traducao } from '@/lib/i18n/servidor'

export default async function Login() {
  const { t } = await traducao()
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-10 flex justify-center">
          <Logo altura={34} />
        </div>
        <div className="rounded-cartao border border-borda bg-superficie p-8">
          <h1 className="text-[24px] font-semibold tracking-tight">{t.login.titulo}</h1>
          <p className="mb-6 mt-1 text-[15px] text-tinta-sub">{t.login.subtitulo}</p>
          <FormAcao acao={entrar} rotulo={t.login.entrar} rotuloPendente={t.login.entrando} t={t.form} larguraTotal>
            <Campo rotulo={t.login.email} nome="email" tipo="email" />
            <Campo rotulo={t.login.senha} nome="senha" tipo="password" />
          </FormAcao>
        </div>
      </div>
    </main>
  )
}
