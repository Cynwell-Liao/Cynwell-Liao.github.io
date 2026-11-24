import { m } from 'framer-motion'
import { FiExternalLink, FiGithub } from 'react-icons/fi'

import { getMotionBrandColorStyle } from '@shared/lib/brand'
import { cardReveal } from '@shared/lib/motion'
import { usePointerFeedback } from '@shared/lib/pointer/usePointerFeedback'
import { BrandLogo } from '@shared/ui/BrandLogo'

import { ProjectActionLink } from './ProjectActionLink'

import type { Project } from '../model/project.types'

interface ProjectCardProps {
  project: Project
  revealDelay: number
  liveLabel: string
  sourceLabel: string
}

export function ProjectCard({
  project,
  revealDelay,
  liveLabel,
  sourceLabel,
}: ProjectCardProps) {
  const { pointerHovered, pointerFeedbackHandlers } = usePointerFeedback()

  return (
    <m.article
      {...cardReveal(revealDelay)}
      {...(project.logoColor
        ? { style: getMotionBrandColorStyle(project.logoColor) }
        : {})}
      className="glass-panel flex h-full flex-col p-8"
      data-pointer-hover={pointerHovered}
      {...pointerFeedbackHandlers}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 in-data-[pointer-hover=true]:opacity-10"
        style={{
          background:
            'radial-gradient(circle at top right, var(--brand-color, #e384b2), transparent 70%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandLogo active={pointerHovered} url={project.logoUrl} />
            <h3 className="brand-title text-xl font-bold tracking-tight text-slate-900 transition-colors dark:text-white">
              {project.title}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {project.liveUrl ? (
              <ProjectActionLink
                href={project.liveUrl}
                icon={FiExternalLink}
                label={liveLabel}
                projectTitle={project.title}
              />
            ) : null}
            {project.repoUrl ? (
              <ProjectActionLink
                href={project.repoUrl}
                icon={FiGithub}
                label={sourceLabel}
                projectTitle={project.title}
              />
            ) : null}
          </div>
        </div>

        <p className="body-copy mb-8 text-slate-700 dark:text-slate-300">
          {project.summary}
        </p>

        <ul className="mb-8 flex-grow space-y-3 border-t border-slate-200 pt-6 dark:border-white/10">
          {project.highlights.map((highlight) => (
            <li
              className="flex items-start gap-3 text-sm leading-snug font-normal text-slate-600 dark:text-slate-400"
              key={highlight}
            >
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: 'var(--brand-color, #e384b2)',
                  boxShadow: '0 0 8px var(--brand-color, #e384b2)',
                }}
              />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-200 pt-6 dark:border-white/10">
          {project.stack.map((tech) => (
            <span
              className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs leading-none font-mono text-accent-600 transition-colors in-data-[pointer-hover=true]:border-accent-400/50 dark:border-white/10 dark:bg-white/5 dark:text-accent-400 dark:in-data-[pointer-hover=true]:border-accent-500/30"
              key={tech}
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </m.article>
  )
}
