interface FooterProps {
  name: string
  githubUrl: string
}

export function Footer({ name, githubUrl }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="section-wrap pb-10 pt-6">
      <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300 md:flex-row md:items-center md:justify-between">
        <p>
          © {currentYear} {name}. Built with React, TypeScript, Tailwind, and Framer Motion.
        </p>
        <a
          className="font-medium text-slate-700 transition hover:text-accent-700 dark:text-slate-200 dark:hover:text-accent-300"
          href={githubUrl}
          rel="noreferrer"
          target="_blank"
        >
          github.com/{name.toLowerCase().replace(/\s+/g, '-')}
        </a>
      </div>
    </footer>
  )
}
