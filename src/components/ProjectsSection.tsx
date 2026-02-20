import { motion } from 'framer-motion'
import type { Project } from '../types/portfolio'
import { SectionHeading } from './SectionHeading'

interface ProjectsSectionProps {
  projects: Project[]
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section className="section-wrap py-20" id="projects">
      <SectionHeading
        description="Selected projects focused on production AI, cloud architecture, and engineering enablement."
        eyebrow="Projects"
        title="Portfolio highlights"
      />
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((project, index) => (
          <motion.article
            className="glass-panel flex h-full flex-col p-6"
            initial={{ opacity: 0, y: 24 }}
            key={project.id}
            transition={{ duration: 0.45, delay: index * 0.05 }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {project.title}
              </h3>
              <div className="flex items-center gap-2">
                {project.liveUrl ? (
                  <a
                    className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-accent-500 hover:text-accent-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-accent-400 dark:hover:text-accent-300"
                    href={project.liveUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Live
                  </a>
                ) : null}
                <a
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-accent-500 hover:text-accent-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-accent-400 dark:hover:text-accent-300"
                  href={project.repoUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Code
                </a>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {project.summary}
            </p>
            <ul className="mt-5 space-y-2">
              {project.highlights.map((highlight) => (
                <li
                  className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300"
                  key={highlight}
                >
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent-500" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <span
                  className="rounded-full border border-slate-200/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:text-slate-200"
                  key={tech}
                >
                  {tech}
                </span>
              ))}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
