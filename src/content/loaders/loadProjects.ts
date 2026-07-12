import type { Project } from '@shared/types/portfolio.types'

import rawProjects from '../data/projects.json'
import { projectsSchema } from '../schemas/project.schema'

import { parseContent } from './parseContent'

export const parseProjects = (input: unknown): readonly Project[] =>
  parseContent(projectsSchema, input, 'content/data/projects.json')

export const projects = parseProjects(rawProjects)
