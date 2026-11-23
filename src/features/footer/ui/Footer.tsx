import { usePointerHover } from '@shared/lib/pointer/usePointerHover'

interface FooterProps {
  name: string
  repositoryUrl: string
}

export function Footer({ name, repositoryUrl }: FooterProps) {
  const { pointerHovered, pointerHoverHandlers } = usePointerHover()
  const currentYear = new Date().getFullYear()
  const repository = new URL(repositoryUrl)
  const repositoryLabel = `${repository.host}${repository.pathname}`.replace(/\/$/u, '')

  return (
    <footer className="section-wrap relative z-10 pt-8 pb-12">
      <div className="flex flex-col items-center gap-4 border-t border-slate-200 pt-8 text-center text-sm font-normal text-slate-600 md:flex-row md:justify-between dark:border-white/10 dark:text-slate-400">
        <p>
          © {currentYear} {name}
        </p>
        <a
          className="rounded-sm font-medium text-slate-600 transition-colors data-[pointer-hover=true]:text-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 dark:focus-visible:ring-accent-500 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50 dark:text-slate-400 dark:data-[pointer-hover=true]:text-accent-300 dark:focus-visible:ring-offset-slate-950"
          data-pointer-hover={pointerHovered}
          {...pointerHoverHandlers}
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
