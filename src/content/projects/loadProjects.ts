import { projectsSchema } from '@features/projects'

import rawProjects from './projects.json'

import type { Project } from '@features/projects'

const parsedProjects = (() => {
  const parseResult = projectsSchema.safeParse(rawProjects)

  if (!parseResult.success) {
    const issueSummary = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')

    throw new Error(`Invalid content/projects/projects.json: ${issueSummary}`)
  }

  return parseResult.data
})()

export const loadProjects = (): Project[] => parsedProjects
