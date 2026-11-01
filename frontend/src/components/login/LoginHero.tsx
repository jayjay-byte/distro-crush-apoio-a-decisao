import { ShieldCheck } from 'lucide-react'
import { LogoCard } from '../brand/LogoCard'
import { AnalysisPreview } from './AnalysisPreview'

/** Painel roxo de apresentação (Figma 10:22111 desktop / 10:22177 mobile). */
export function LoginHero() {
  return (
    <section className="flex flex-col gap-7 bg-brand-hero p-7 text-hero-fg lg:w-login-hero lg:shrink-0 lg:gap-18 lg:p-16">
      <div className="flex flex-col gap-8">
        <div className="lg:hidden">
          <LogoCard size="md" />
        </div>
        <div className="hidden lg:block">
          <LogoCard size="lg" />
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-small font-semibold text-hero-eyebrow">APOIO À DECISÃO · LINUX</p>
          <p className="text-title font-extrabold lg:text-display">
            Sua próxima distro.
            <br />
            Nós mostramos os caminhos, você decide.
          </p>
          <p className="text-lead text-hero-soft lg:text-heading">
            Analisamos o seu perfil e mostramos as opções mais adequadas.
          </p>
        </div>
      </div>

      <AnalysisPreview className="hidden lg:flex" />

      <p className="flex items-center gap-2 text-label text-hero-soft">
        <ShieldCheck aria-hidden className="size-4 shrink-0 text-hero-eyebrow" />
        Critérios claros. Recomendações explicáveis.
      </p>
    </section>
  )
}
