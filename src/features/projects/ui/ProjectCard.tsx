import { m } from 'framer-motion'
import { useState } from 'react'
import { FiExternalLink, FiGithub } from 'react-icons/fi'

import { cardReveal } from '@shared/lib/motion'

import { ProjectActionLink } from './ProjectActionLink'

import type { Project } from '../model/project.types'
import type { CSSProperties } from 'react'

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
  const [hasLogoError, setHasLogoError] = useState(false)

  return (
    <m.article
      {...cardReveal(revealDelay)}
      className="glass-panel group flex h-full flex-col p-8"
      style={
        project.logoColor
          ? ({
              '--brand-logo-color': project.logoColor,
            } as CSSProperties)
          : undefined
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${project.logoColor ?? '#e384b2'}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {project.logoUrl && !hasLogoError ? (
              <span
                aria-hidden="true"
                className="project-brand-tile brand-logo-tile inline-flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-[0_0_15px_rgba(227,132,178,0.1)] transition-[transform,border-color] duration-300 group-hover:scale-110"
                style={
                  project.logoColor
                    ? ({
                        '--brand-logo-color': project.logoColor,
                      } as CSSProperties)
                    : undefined
                }
              >
                <img
                  alt=""
                  className="h-6 w-6 object-contain"
                  decoding="async"
                  height={24}
                  loading="lazy"
                  onError={() => {
                    setHasLogoError(true)
                  }}
                  referrerPolicy="no-referrer"
                  src={project.logoUrl}
                  width={24}
                />
              </span>
            ) : null}
            <h3
              className="project-brand-title text-xl font-bold tracking-tight text-slate-900 transition-colors dark:text-white"
              style={
                project.logoColor
                  ? ({
                      '--brand-logo-color': project.logoColor,
                    } as CSSProperties)
                  : undefined
              }
            >
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
                  backgroundColor: project.logoColor ?? '#e384b2',
                  boxShadow: `0 0 8px ${project.logoColor ?? '#e384b2'}`,
                }}
              />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-200 pt-6 dark:border-white/10">
          {project.stack.map((tech) => (
            <span
              className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs leading-none font-mono text-accent-600 transition-colors group-hover:border-accent-400/50 dark:border-white/10 dark:bg-white/5 dark:text-accent-400 dark:group-hover:border-accent-500/30"
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
