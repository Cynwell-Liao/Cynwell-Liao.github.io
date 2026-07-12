import type { SkillCategory } from '@shared/types/portfolio.types'

import rawSkills from '../data/skills.json'
import { skillCategoriesSchema } from '../schemas/skills.schema'

import { parseContent } from './parseContent'

export const parseSkills = (input: unknown): readonly SkillCategory[] =>
  parseContent(skillCategoriesSchema, input, 'content/data/skills.json')

export const skillCategories = parseSkills(rawSkills)
