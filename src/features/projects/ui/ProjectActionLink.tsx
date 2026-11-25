import { usePointerFeedback } from '@shared/lib/pointer/usePointerFeedback'

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
  const { pointerActive, pointerFeedbackHandlers } = usePointerFeedback()

  return (
    <a
      aria-label={accessibleName}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-[color,background-color,border-color,scale] data-[pointer-hover=true]:scale-105 data-[pointer-hover=true]:border-secondary-400/50 data-[pointer-hover=true]:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-600 dark:focus-visible:ring-secondary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:data-[pointer-hover=true]:border-secondary-400/50 dark:data-[pointer-hover=true]:text-secondary-300 dark:focus-visible:ring-offset-slate-950"
      data-pointer-hover={pointerActive}
      {...pointerFeedbackHandlers}
      href={href}
      rel="noreferrer"
      target="_blank"
      title={accessibleName}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </a>
  )
}
