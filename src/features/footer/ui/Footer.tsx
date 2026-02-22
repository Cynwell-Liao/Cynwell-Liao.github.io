interface FooterProps {
  name: string
  repositoryUrl: string
  attribution: string
}

export function Footer({ name, repositoryUrl, attribution }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="section-wrap pb-12 pt-8 relative z-10">
      <div className="flex flex-col gap-4 border-t border-slate-200 dark:border-white/10 pt-8 text-sm text-slate-600 dark:text-slate-500 font-light md:flex-row md:items-center md:justify-between items-center text-center">
        <p>
          © {currentYear} {name}. {attribution}
        </p>
        <a
          className="font-medium text-slate-500 dark:text-slate-400 transition hover:text-accent-600 dark:hover:text-accent-300"
          href={repositoryUrl}
          rel="noreferrer"
          target="_blank"
        >
          {repositoryUrl.replace('https://', '')}
        </a>
      </div>
    </footer>
  )
}
