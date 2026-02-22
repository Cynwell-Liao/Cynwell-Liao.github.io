import { FiMoon, FiSun } from 'react-icons/fi'
import type { NavLink, ThemeMode } from '../types/portfolio'
import { motion, useScroll } from 'framer-motion'
import { useState, useEffect } from 'react'
import { twMerge } from 'tailwind-merge'

interface NavbarProps {
  links: NavLink[]
  theme: ThemeMode
  githubUrl: string
  onToggleTheme: () => void
}

export function Navbar({ links, theme, githubUrl, onToggleTheme }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setIsScrolled(latest > 50)
    })
  }, [scrollY])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4 pointer-events-none transition-all duration-300"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={twMerge(
          "pointer-events-auto flex items-center justify-between px-6 py-3 rounded-full border transition-all duration-500",
          isScrolled
            ? "bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-white/10 shadow-soft dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-xl w-full max-w-4xl"
            : "bg-transparent border-transparent w-full max-w-6xl"
        )}
      >
        {/* Brand Container */}
        <div className="flex items-center gap-4">
          {/* Favicon / Logo Image */}
          <a href="#home" className="transition-transform hover:scale-105">
            <img src="/favicon.ico" alt="Logo" className="w-9 h-9 rounded-sm" />
          </a>

          <div className="w-px h-4 bg-slate-300 dark:bg-white/20 hidden sm:block" />

          {/* Text Brand */}
          <span className="text-sm font-bold tracking-widest text-slate-900 dark:text-white group relative overflow-hidden hidden sm:flex items-center gap-2">
            Cynwell-Liao
          </span>
        </div>

        <nav className="hidden items-center gap-8 md:flex absolute left-1/2 -translate-x-1/2">
          {links.map((link) => (
            <a
              key={link.href}
              className="text-sm font-medium tracking-wide text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white relative group"
              href={link.href}
            >
              {link.label}
              <span className="absolute -bottom-2 left-1/2 w-1 h-1 bg-accent-400 rounded-full opacity-0 -translate-x-1/2 transition-all duration-300 group-hover:opacity-100 group-hover:-translate-y-1" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            className="text-sm font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-slate-900 dark:hover:text-white hidden sm:block"
            href={githubUrl}
            rel="noreferrer"
            target="_blank"
          >
            GitHub
          </a>
          <div className="w-px h-4 bg-slate-300 dark:bg-white/20 hidden sm:block" />
          <button
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 transition-all hover:bg-slate-200 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-white"
            onClick={onToggleTheme}
            type="button"
          >
            {theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </motion.header>
  )
}
