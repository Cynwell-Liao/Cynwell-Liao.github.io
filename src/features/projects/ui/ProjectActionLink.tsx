import type { IconType } from 'react-icons'

interface ProjectActionLinkProps {
  href: string
  icon: IconType
  label: string
  projectTitle: string
}

export function ProjectActionLink({
  href,
  icon: Icon,
  label,
  projectTitle,
}: ProjectActionLinkProps) {
  const accessibleName = `${label}: ${projectTitle}`

  return (
    <a
      aria-label={accessibleName}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-[color,background-color,border-color,transform] hover:scale-105 hover:border-secondary-400/50 hover:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600 dark:focus-visible:ring-secondary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-secondary-400/50 dark:hover:text-secondary-300 dark:focus-visible:ring-offset-slate-950"
      href={href}
      rel="noreferrer"
      target="_blank"
      title={accessibleName}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </a>
  )
}
