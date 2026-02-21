interface FooterProps {
  name: string
  githubUrl: string
}

export function Footer({ name, githubUrl }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="section-wrap pb-12 pt-8 relative z-10">
      <div className="flex flex-col gap-4 border-t border-slate-200 dark:border-white/10 pt-8 text-sm text-slate-600 dark:text-slate-500 font-light md:flex-row md:items-center md:justify-between items-center text-center">
        <p>
          © {currentYear} {name}. Engineered with React, Tailwind, and Framer Motion.
        </p>
        <a
          className="font-medium text-slate-500 dark:text-slate-400 transition hover:text-accent-600 dark:hover:text-accent-300"
          href={githubUrl}
          rel="noreferrer"
          target="_blank"
        >
          {githubUrl.replace('https://', '')}
        </a>
      </div>
    </footer>
  )
}
