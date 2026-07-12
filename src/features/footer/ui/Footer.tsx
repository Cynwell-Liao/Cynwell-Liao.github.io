interface FooterProps {
  name: string
  repositoryUrl: string
  attribution: string
}

export function Footer({ name, repositoryUrl, attribution }: FooterProps) {
  const currentYear = new Date().getFullYear()
  const repository = new URL(repositoryUrl)
  const repositoryLabel = `${repository.host}${repository.pathname}`.replace(/\/$/u, '')

  return (
    <footer className="section-wrap relative z-10 pt-8 pb-12">
      <div className="flex flex-col items-center gap-4 border-t border-slate-200 pt-8 text-center text-sm font-light text-slate-600 md:flex-row md:justify-between dark:border-white/10 dark:text-slate-400">
        <p>
          © {currentYear} {name}. {attribution}
        </p>
        <a
          className="rounded-sm font-medium text-slate-500 transition-colors hover:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50 dark:text-slate-400 dark:hover:text-accent-300 dark:focus-visible:ring-offset-slate-950"
          href={repositoryUrl}
          rel="noreferrer"
          target="_blank"
        >
          {repositoryLabel}
        </a>
      </div>
    </footer>
  )
}
