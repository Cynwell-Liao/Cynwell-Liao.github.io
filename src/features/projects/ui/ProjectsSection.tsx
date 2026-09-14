import { SECTION_ID } from '@shared/lib/navigation'
import { SectionHeading } from '@shared/ui/SectionHeading'

import { ProjectCard } from './ProjectCard'

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
      id={SECTION_ID.projects}
    >
      <SectionHeading
        description={headingDescription}
        eyebrow={headingEyebrow}
        id="projects-heading"
        title={headingTitle}
      />
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            liveLabel={liveLabel}
            project={project}
            revealDelay={index * 0.1}
            sourceLabel={sourceLabel}
          />
        ))}
      </div>
    </section>
  )
}
