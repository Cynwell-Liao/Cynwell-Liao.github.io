import { m } from 'framer-motion'
import { FiExternalLink, FiGithub } from 'react-icons/fi'

import { cardReveal } from '@shared/lib/motion'

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
  return (
    <m.article
      {...cardReveal(revealDelay)}
      className="glass-panel group flex h-full flex-col p-8"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-500/10 to-secondary-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-accent-600 dark:text-white dark:group-hover:text-accent-300">
            {project.title}
          </h3>
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

        <ul className="mb-8 space-y-3 flex-grow">
          {project.highlights.map((highlight) => (
            <li
              className="body-copy flex items-start gap-3 text-slate-600 dark:text-slate-400"
              key={highlight}
            >
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(227,132,178,0.8)]"
              />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-200 pt-6 dark:border-white/10">
          {project.stack.map((tech) => (
            <span
              className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs tracking-wider text-accent-700 uppercase transition-colors group-hover:border-accent-400/50 dark:border-white/10 dark:bg-white/5 dark:text-accent-100 dark:group-hover:border-accent-500/30"
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
