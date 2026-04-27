import rawEducation from '../data/education.json'
import { educationSchema } from '../schemas/education.schema'

import type { EducationItem } from '@shared/types/portfolio.types'

export const parseEducation = (input: unknown): EducationItem[] => {
  const parseResult = educationSchema.safeParse(input)

  if (!parseResult.success) {
    const issueSummary = parseResult.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')

    throw new Error(`Invalid content/data/education.json: ${issueSummary}`)
  }

  return parseResult.data
}

const parsedEducation = parseEducation(rawEducation)

export const loadEducation = (): EducationItem[] => parsedEducation
