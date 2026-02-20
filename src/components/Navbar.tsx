import { FiMoon, FiSun } from 'react-icons/fi'
import type { NavLink, ThemeMode } from '../types/portfolio'

interface NavbarProps {
  links: NavLink[]
  theme: ThemeMode
  githubUrl: string
  onToggleTheme: () => void
}

export function Navbar({ links, theme, githubUrl, onToggleTheme }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="section-wrap flex h-20 items-center justify-between gap-4">
        <a
          className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-900 dark:text-slate-50"
          href="#home"
        >
          CL
        </a>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <a key={link.href} className="anchor-link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            className="rounded-full border border-slate-300/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-accent-500 hover:text-accent-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-accent-400 dark:hover:text-accent-300"
            href={githubUrl}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <button
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300/70 text-slate-700 transition hover:border-accent-500 hover:text-accent-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-accent-400 dark:hover:text-accent-300"
            onClick={onToggleTheme}
            type="button"
          >
            {theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
