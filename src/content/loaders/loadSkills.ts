import rawSkills from '../data/skills.json'
import { skillCategoriesSchema } from '../schemas/skills.schema'

import type { SkillCategory } from '@shared/types/portfolio.types'

export const parseSkills = (input: unknown): SkillCategory[] => {
  const parseResult = skillCategoriesSchema.safeParse(input)

  if (!parseResult.success) {
    const issueSummary = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')

    throw new Error(`Invalid content/data/skills.json: ${issueSummary}`)
  }

  return parseResult.data
}

const parsedSkills = parseSkills(rawSkills)

export const loadSkills = (): SkillCategory[] => parsedSkills
