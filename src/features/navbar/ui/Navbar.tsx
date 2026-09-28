import { m, useScroll } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FiMoon, FiSun, FiTerminal } from 'react-icons/fi'

import { cn } from '@shared/lib/cn'
import { SECTION_ID } from '@shared/lib/navigation'
import type { ThemeMode } from '@shared/types/common'

import { SectionNavigation } from './SectionNavigation'

import type { NavLink } from '../model/nav.types'

interface NavbarProps {
  brandName: string
  links: readonly NavLink[]
  theme: ThemeMode
  onOpenTerminal: (opener: HTMLButtonElement) => void
  onToggleTheme: () => void
}

export function Navbar({
  brandName,
  links,
  theme,
  onOpenTerminal,
  onToggleTheme,
}: NavbarProps) {
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(() => scrollY.get() > 50)
  const logoUrl = `${import.meta.env.BASE_URL}favicon.ico`

  useEffect(() => {
    return scrollY.on('change', (latest) => {
      setIsScrolled(latest > 50)
    })
  }, [scrollY])

  return (
    <m.header
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-6"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div
        className={cn(
          'pointer-events-auto grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 rounded-full border-0 p-1 transition-[max-width,background-color,border-color,box-shadow] duration-500 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
          isScrolled
            ? 'max-w-4xl bg-white/80 shadow-soft ring-1 ring-slate-200 backdrop-blur-xl dark:bg-slate-900/40 dark:ring-white/10 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]'
            : 'max-w-6xl bg-transparent'
        )}
      >
        <a
          aria-label={`${brandName} home`}
          className="flex min-w-0 items-center gap-4 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 dark:focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 md:max-lg:gap-2"
          href={`#${SECTION_ID.home}`}
        >
          <img alt="" className="h-9 w-9 shrink-0 rounded-sm" src={logoUrl} />
          <span
            aria-hidden="true"
            className="hidden h-4 w-px shrink-0 bg-slate-300 dark:bg-white/20 sm:block md:max-lg:hidden"
          />
          <span
            className="min-w-0 truncate text-sm font-bold tracking-widest text-slate-900 dark:text-white md:max-lg:text-xs md:max-lg:tracking-normal"
            data-testid="navbar-brand"
          >
            {brandName}
          </span>
        </a>

        <SectionNavigation links={links} theme={theme} />

        <div className="flex items-center justify-self-end gap-3 md:col-start-3 md:gap-4">
          <button
            className="hidden items-center gap-2 rounded-lg px-1 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 dark:focus-visible:ring-accent-500 dark:text-slate-300 dark:hover:text-white sm:inline-flex"
            onClick={(event) => {
              onOpenTerminal(event.currentTarget)
            }}
            type="button"
          >
            <FiTerminal aria-hidden="true" className="h-4 w-4" />
            Terminal
          </button>
          <span
            aria-hidden="true"
            className="hidden h-4 w-px bg-slate-300 dark:bg-white/20 sm:block"
          />
          <button
            aria-label={
              theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 transition-[color,background-color,border-color] hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 dark:focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-offset-slate-950"
            onClick={onToggleTheme}
            type="button"
          >
            {theme === 'dark' ? (
              <FiSun aria-hidden="true" className="h-4 w-4" />
            ) : (
              <FiMoon aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </m.header>
  )
}
