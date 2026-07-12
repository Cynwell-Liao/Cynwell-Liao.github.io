import { m } from 'framer-motion'
import { FiExternalLink, FiGithub } from 'react-icons/fi'

import { SectionHeading } from '@shared/ui/SectionHeading'

import type { Project } from '../model/project.types'

interface ProjectsSectionProps {
  projects: readonly Project[]
  headingEyebrow: string
  headingTitle: string
  headingDescription: string
  liveLabel: string
  sourceLabel: string
}

export function ProjectsSection({
  projects,
  headingEyebrow,
  headingTitle,
  headingDescription,
  liveLabel,
  sourceLabel,
}: ProjectsSectionProps) {
  return (
    <section
      aria-labelledby="projects-heading"
      className="section-wrap relative scroll-mt-24 py-24"
      id="projects"
    >
      <SectionHeading
        description={headingDescription}
        eyebrow={headingEyebrow}
        id="projects-heading"
        title={headingTitle}
      />
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {projects.map((project, index) => (
          <m.article
            className="glass-panel group flex h-full flex-col p-8"
            initial={{ opacity: 0, y: 30 }}
            key={project.id}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
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
                    <a
                      aria-label={`${liveLabel}: ${project.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-[color,background-color,border-color,transform] hover:scale-105 hover:border-secondary-400/50 hover:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-secondary-400/50 dark:hover:text-secondary-300 dark:focus-visible:ring-offset-slate-950"
                      href={project.liveUrl}
                      rel="noreferrer"
                      target="_blank"
                      title={`${liveLabel}: ${project.title}`}
                    >
                      <FiExternalLink aria-hidden="true" className="h-5 w-5" />
                    </a>
                  ) : null}
                  {project.repoUrl ? (
                    <a
                      aria-label={`${sourceLabel}: ${project.title}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-[color,background-color,border-color,transform] hover:scale-105 hover:border-secondary-400/50 hover:text-secondary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-secondary-400/50 dark:hover:text-secondary-300 dark:focus-visible:ring-offset-slate-950"
                      href={project.repoUrl}
                      rel="noreferrer"
                      target="_blank"
                      title={`${sourceLabel}: ${project.title}`}
                    >
                      <FiGithub aria-hidden="true" className="h-5 w-5" />
                    </a>
                  ) : null}
                </div>
              </div>

              <p className="mb-8 text-base leading-relaxed font-light text-slate-700 dark:text-slate-300">
                {project.summary}
              </p>

              <ul className="mb-8 space-y-3 flex-grow">
                {project.highlights.map((highlight) => (
                  <li
                    className="flex items-start gap-3 text-sm leading-relaxed font-light text-slate-600 dark:text-slate-400"
                    key={highlight}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(227,132,178,0.8)]"
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-2 border-t border-slate-200 pt-6 dark:border-white/10">
                {project.stack.map((tech) => (
                  <span
                    className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-[11px] tracking-wider text-accent-700 uppercase transition-colors group-hover:border-accent-400/50 dark:border-white/10 dark:bg-white/5 dark:text-accent-100 dark:group-hover:border-accent-500/30"
                    key={tech}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </m.article>
        ))}
      </div>
    </section>
  )
}
