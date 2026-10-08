import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LEGAL_DOCS, LEGAL_UPDATED_AT, LEGAL_VERSION, OPERADOR } from './legalConfig'

type LegalLayoutProps = {
  title: string
  subtitle?: string
  children: ReactNode
}

const PROSE =
  '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-9 [&_h2]:mb-3 ' +
  '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 ' +
  '[&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 ' +
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1.5 ' +
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1.5 ' +
  '[&_li]:text-muted-foreground [&_li]:leading-relaxed ' +
  '[&_strong]:text-foreground [&_strong]:font-semibold ' +
  '[&_a]:text-violet-600 [&_a]:hover:text-violet-500 [&_a]:underline [&_a]:underline-offset-2 ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-violet-300 [&_blockquote]:pl-4 ' +
  '[&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:mb-4'

export default function LegalLayout({ title, subtitle, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-violet-50/40">
      <header className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <Link to="/login" className="flex items-center gap-2">
          <img src="/logo.png" alt="zettastock" className="h-8 w-auto object-contain" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-violet-500/20"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-base">{subtitle}</p>}
          <p className="text-xs text-muted-foreground mt-3">
            Versión {LEGAL_VERSION} · Última actualización: {LEGAL_UPDATED_AT}
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 sm:p-9 shadow-lg shadow-slate-200/60">
          <div className={PROSE}>{children}</div>
        </div>
      </main>

      <footer className="border-t border-border/60 py-8">
        <nav className="max-w-3xl mx-auto px-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm mb-4">
          {LEGAL_DOCS.map((doc) => (
            <Link
              key={doc.path}
              to={doc.path}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {doc.title}
            </Link>
          ))}
        </nav>
        <p className="text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {OPERADOR.razonSocial} · Todos los derechos reservados
        </p>
      </footer>
    </div>
  )
}
