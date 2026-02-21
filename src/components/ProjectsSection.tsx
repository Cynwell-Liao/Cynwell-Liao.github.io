import { motion } from 'framer-motion'
import { FiExternalLink, FiGithub } from 'react-icons/fi'
import type { Project } from '../types/portfolio'
import { SectionHeading } from './SectionHeading'

interface ProjectsSectionProps {
  projects: Project[]
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  return (
    <section className="section-wrap py-24 relative" id="projects">
      <SectionHeading
        description="Selected projects focused on production AI, cloud architecture, and engineering enablement."
        eyebrow="Projects"
        title="Portfolio highlights"
      />
      <div className="grid gap-8 md:grid-cols-2 mt-12">
        {projects.map((project, index) => (
          <motion.article
            className="group glass-panel flex flex-col p-8 relative overflow-hidden h-full"
            initial={{ opacity: 0, y: 30 }}
            key={project.id}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true, amount: 0.2 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {/* Hover Spotlight */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 rounded-3xl pointer-events-none" />

            <div className="flex flex-col h-full relative z-10">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <h3 className="text-2xl font-bold tracking-tight text-white group-hover:text-accent-300 transition-colors">
                  {project.title}
                </h3>
                <div className="flex items-center gap-3">
                  {project.liveUrl ? (
                    <a
                      className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-accent-300 hover:border-accent-400/50 transition-all hover:scale-110"
                      href={project.liveUrl}
                      rel="noreferrer"
                      target="_blank"
                      title="View Live"
                    >
                      <FiExternalLink className="w-5 h-5" />
                    </a>
                  ) : null}
                  <a
                    className="p-2 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-accent-300 hover:border-accent-400/50 transition-all hover:scale-110"
                    href={project.repoUrl}
                    rel="noreferrer"
                    target="_blank"
                    title="View Source"
                  >
                    <FiGithub className="w-5 h-5" />
                  </a>
                </div>
              </div>

              <p className="text-base leading-relaxed text-slate-300 font-light mb-8">
                {project.summary}
              </p>

              <ul className="mb-8 space-y-3 flex-grow">
                {project.highlights.map((highlight) => (
                  <li
                    className="flex items-start gap-3 text-sm text-slate-400 font-light leading-relaxed"
                    key={highlight}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(125,215,197,0.8)]" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto flex flex-wrap gap-2 pt-6 border-t border-white/10">
                {project.stack.map((tech) => (
                  <span
                    className="rounded-md bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] font-mono tracking-wider text-accent-100 uppercase transition-colors group-hover:border-accent-500/30"
                    key={tech}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
