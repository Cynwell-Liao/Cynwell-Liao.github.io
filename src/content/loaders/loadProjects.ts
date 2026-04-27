import rawProjects from '../data/projects.json'
import { projectsSchema } from '../schemas/project.schema'

import type { Project } from '@shared/types/portfolio.types'

export const parseProjects = (input: unknown): Project[] => {
  const parseResult = projectsSchema.safeParse(input)

  if (!parseResult.success) {
    const issueSummary = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')

    throw new Error(`Invalid content/data/projects.json: ${issueSummary}`)
  }

  return parseResult.data
}

const parsedProjects = parseProjects(rawProjects)

export const loadProjects = (): Project[] => parsedProjects
